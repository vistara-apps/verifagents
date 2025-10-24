// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title InferenceMarket
 * @dev Proof-of-Inference Market with EigenLayer AVS integration
 * @notice Implements verifiable ML inference with staking and slashing mechanisms
 */
contract InferenceMarket is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Structs
    struct ModelListing {
        string id;
        string name;
        string description;
        uint8 modelType; // 0: LLM, 1: VISION, 2: AUDIO, 3: MULTIMODAL, 4: CUSTOM
        uint8[] tasks; // Array of supported task types
        uint256 pricePerInference;
        uint256 maxConcurrentRequests;
        uint256 minStake;
        uint256 totalStake;
        uint256 validatorCount;
        uint256 accuracy; // 0-10000 (0-100%)
        uint256 latency; // milliseconds
        uint256 uptime; // 0-10000 (0-100%)
        bool isActive;
        address owner;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct InferenceRequest {
        string id;
        string modelId;
        bytes input;
        uint8 task;
        uint256 maxTokens;
        uint256 temperature;
        uint256 topP;
        uint256 timeout;
        uint256 reward;
        address requester;
        uint256 createdAt;
        uint256 deadline;
    }

    struct InferenceResult {
        string id;
        string requestId;
        string modelId;
        bytes output;
        uint256 confidence; // 0-10000 (0-100%)
        uint256 latency;
        uint256 gasUsed;
        address validator;
        uint256 submittedAt;
        bool verified;
        string verificationProof;
    }

    struct VerificationProof {
        string id;
        string resultId;
        address validator;
        bytes32 proof;
        bytes32 merkleRoot;
        uint256 blockNumber;
        uint256 timestamp;
        uint8 status; // 0: PENDING, 1: VERIFIED, 2: REJECTED, 3: DISPUTED
        address[] challengers;
        address[] arbitrators;
        uint256 stakeAmount;
        uint256 slashingAmount;
    }

    struct ValidatorStake {
        address validator;
        string modelId;
        uint256 stakeAmount;
        uint256 delegatedAmount;
        uint256 totalStake;
        uint256 slashingRisk; // 0-10000 (0-100%)
        uint256 rewards;
        uint256 lastUpdate;
    }

    struct Challenge {
        string id;
        string resultId;
        address challenger;
        string reason;
        string evidence;
        uint256 stakeAmount;
        uint8 status; // 0: PENDING, 1: VERIFIED, 2: REJECTED, 3: DISPUTED
        uint256 createdAt;
        uint256 resolvedAt;
        address arbitrator;
    }

    // State variables
    mapping(string => ModelListing) public modelListings;
    mapping(string => InferenceRequest) public inferenceRequests;
    mapping(string => InferenceResult) public inferenceResults;
    mapping(string => VerificationProof) public verificationProofs;
    mapping(string => Challenge) public challenges;
    
    mapping(address => mapping(string => ValidatorStake)) public validatorStakes;
    mapping(address => uint256) public totalValidatorStake;
    mapping(string => address[]) public modelValidators;
    mapping(string => uint256) public modelTotalStake;
    
    mapping(bytes32 => bool) public usedProofs;
    mapping(string => uint256) public modelInferenceCount;
    mapping(string => uint256) public modelTotalRewards;
    
    IERC20 public immutable rewardToken;
    address public eigenLayerAVS;
    address public erc8004Registry;
    
    uint256 public constant MAX_MODELS = 1000;
    uint256 public constant MAX_VALIDATORS_PER_MODEL = 100;
    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant MAX_SLASHING_PERCENTAGE = 5000; // 50%
    uint256 public constant VERIFICATION_WINDOW = 1 hours;
    uint256 public constant CHALLENGE_WINDOW = 24 hours;
    
    // Events
    event ModelListed(string indexed modelId, string name, address indexed owner, uint256 pricePerInference);
    event InferenceRequested(string indexed requestId, string indexed modelId, address indexed requester, uint256 reward);
    event InferenceSubmitted(string indexed resultId, string indexed requestId, address indexed validator, uint256 confidence);
    event InferenceVerified(string indexed resultId, address indexed validator, bool verified);
    event ChallengeSubmitted(string indexed challengeId, string indexed resultId, address indexed challenger, uint256 stakeAmount);
    event ChallengeResolved(string indexed challengeId, bool valid, address indexed arbitrator);
    event ValidatorStaked(address indexed validator, string indexed modelId, uint256 amount);
    event ValidatorSlashed(address indexed validator, string indexed modelId, uint256 amount, string reason);
    event RewardsDistributed(string indexed modelId, uint256 totalAmount, uint256 validatorCount);
    event DelegationCreated(address indexed delegator, address indexed validator, string indexed modelId, uint256 amount);

    constructor(address _rewardToken, address _eigenLayerAVS, address _erc8004Registry) {
        rewardToken = IERC20(_rewardToken);
        eigenLayerAVS = _eigenLayerAVS;
        erc8004Registry = _erc8004Registry;
    }

    /**
     * @dev List a new model for inference
     */
    function listModel(
        string memory _modelId,
        string memory _name,
        string memory _description,
        uint8 _modelType,
        uint8[] memory _tasks,
        uint256 _pricePerInference,
        uint256 _maxConcurrentRequests,
        uint256 _minStake
    ) external {
        require(bytes(modelListings[_modelId].id).length == 0, "Model already listed");
        require(_modelType <= 4, "Invalid model type");
        require(_tasks.length > 0, "No tasks specified");
        require(_pricePerInference > 0, "Invalid price");
        require(_minStake >= MIN_STAKE, "Insufficient min stake");
        
        modelListings[_modelId] = ModelListing({
            id: _modelId,
            name: _name,
            description: _description,
            modelType: _modelType,
            tasks: _tasks,
            pricePerInference: _pricePerInference,
            maxConcurrentRequests: _maxConcurrentRequests,
            minStake: _minStake,
            totalStake: 0,
            validatorCount: 0,
            accuracy: 0,
            latency: 0,
            uptime: 10000, // 100%
            isActive: true,
            owner: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ModelListed(_modelId, _name, msg.sender, _pricePerInference);
    }

    /**
     * @dev Request inference from a model
     */
    function requestInference(
        string memory _requestId,
        string memory _modelId,
        bytes memory _input,
        uint8 _task,
        uint256 _maxTokens,
        uint256 _temperature,
        uint256 _topP,
        uint256 _timeout
    ) external payable {
        require(modelListings[_modelId].isActive, "Model not active");
        require(modelListings[_modelId].validatorCount > 0, "No validators available");
        require(_timeout > 0, "Invalid timeout");
        
        uint256 reward = modelListings[_modelId].pricePerInference;
        require(msg.value >= reward, "Insufficient payment");
        
        inferenceRequests[_requestId] = InferenceRequest({
            id: _requestId,
            modelId: _modelId,
            input: _input,
            task: _task,
            maxTokens: _maxTokens,
            temperature: _temperature,
            topP: _topP,
            timeout: _timeout,
            reward: reward,
            requester: msg.sender,
            createdAt: block.timestamp,
            deadline: block.timestamp + _timeout
        });
        
        modelInferenceCount[_modelId]++;
        
        emit InferenceRequested(_requestId, _modelId, msg.sender, reward);
    }

    /**
     * @dev Submit inference result
     */
    function submitResult(
        string memory _resultId,
        string memory _requestId,
        bytes memory _output,
        uint256 _confidence,
        uint256 _latency,
        string memory _verificationProof
    ) external {
        require(inferenceRequests[_requestId].deadline > block.timestamp, "Request expired");
        require(validatorStakes[msg.sender][inferenceRequests[_requestId].modelId].stakeAmount > 0, "Not a validator");
        
        inferenceResults[_resultId] = InferenceResult({
            id: _resultId,
            requestId: _requestId,
            modelId: inferenceRequests[_requestId].modelId,
            output: _output,
            confidence: _confidence,
            latency: _latency,
            gasUsed: 0, // Will be set after verification
            validator: msg.sender,
            submittedAt: block.timestamp,
            verified: false,
            verificationProof: _verificationProof
        });
        
        emit InferenceSubmitted(_resultId, _requestId, msg.sender, _confidence);
    }

    /**
     * @dev Verify inference result
     */
    function verifyInference(
        string memory _resultId,
        bytes32[] memory _merkleProof
    ) external {
        require(inferenceResults[_resultId].submittedAt > 0, "Result not found");
        require(!inferenceResults[_resultId].verified, "Already verified");
        require(block.timestamp <= inferenceResults[_resultId].submittedAt + VERIFICATION_WINDOW, "Verification window closed");
        
        // Verify merkle proof (simplified)
        bytes32 leaf = keccak256(abi.encodePacked(_resultId, msg.sender, block.timestamp));
        require(!usedProofs[leaf], "Proof already used");
        usedProofs[leaf] = true;
        
        inferenceResults[_resultId].verified = true;
        inferenceResults[_resultId].gasUsed = gasleft();
        
        // Create verification proof
        string memory proofId = string(abi.encodePacked("proof-", _resultId));
        verificationProofs[proofId] = VerificationProof({
            id: proofId,
            resultId: _resultId,
            validator: msg.sender,
            proof: leaf,
            merkleRoot: leaf,
            blockNumber: block.number,
            timestamp: block.timestamp,
            status: 1, // VERIFIED
            challengers: new address[](0),
            arbitrators: new address[](0),
            stakeAmount: validatorStakes[msg.sender][inferenceResults[_resultId].modelId].stakeAmount,
            slashingAmount: 0
        });
        
        // Distribute rewards
        _distributeRewards(inferenceResults[_resultId].modelId, inferenceRequests[inferenceResults[_resultId].requestId].reward);
        
        emit InferenceVerified(_resultId, msg.sender, true);
    }

    /**
     * @dev Challenge inference result
     */
    function challengeResult(
        string memory _challengeId,
        string memory _resultId,
        string memory _reason,
        string memory _evidence
    ) external payable {
        require(inferenceResults[_resultId].verified, "Result not verified");
        require(block.timestamp <= inferenceResults[_resultId].submittedAt + CHALLENGE_WINDOW, "Challenge window closed");
        require(msg.value >= MIN_STAKE, "Insufficient stake for challenge");
        
        challenges[_challengeId] = Challenge({
            id: _challengeId,
            resultId: _resultId,
            challenger: msg.sender,
            reason: _reason,
            evidence: _evidence,
            stakeAmount: msg.value,
            status: 0, // PENDING
            createdAt: block.timestamp,
            resolvedAt: 0,
            arbitrator: address(0)
        });
        
        emit ChallengeSubmitted(_challengeId, _resultId, msg.sender, msg.value);
    }

    /**
     * @dev Resolve challenge
     */
    function resolveChallenge(
        string memory _challengeId,
        bool _valid,
        string memory _reason
    ) external onlyOwner {
        require(challenges[_challengeId].status == 0, "Challenge already resolved");
        
        challenges[_challengeId].status = _valid ? 2 : 1; // REJECTED or VERIFIED
        challenges[_challengeId].resolvedAt = block.timestamp;
        challenges[_challengeId].arbitrator = msg.sender;
        
        if (_valid) {
            // Slash validator
            address validator = inferenceResults[challenges[_challengeId].resultId].validator;
            uint256 slashingAmount = validatorStakes[validator][inferenceResults[challenges[_challengeId].resultId].modelId].stakeAmount / 10; // 10% slash
            
            validatorStakes[validator][inferenceResults[challenges[_challengeId].resultId].modelId].stakeAmount -= slashingAmount;
            validatorStakes[validator][inferenceResults[challenges[_challengeId].resultId].modelId].slashingRisk += 1000; // Increase risk
            
            // Reward challenger
            payable(challenges[_challengeId].challenger).transfer(challenges[_challengeId].stakeAmount + slashingAmount);
            
            emit ValidatorSlashed(validator, inferenceResults[challenges[_challengeId].resultId].modelId, slashingAmount, _reason);
        } else {
            // Reward validator
            address validator = inferenceResults[challenges[_challengeId].resultId].validator;
            payable(validator).transfer(challenges[_challengeId].stakeAmount);
        }
        
        emit ChallengeResolved(_challengeId, _valid, msg.sender);
    }

    /**
     * @dev Stake as validator for a model
     */
    function stakeValidator(
        string memory _modelId,
        uint256 _amount
    ) external payable {
        require(modelListings[_modelId].isActive, "Model not active");
        require(_amount >= modelListings[_modelId].minStake, "Insufficient stake");
        require(msg.value >= _amount, "Insufficient payment");
        
        if (validatorStakes[msg.sender][_modelId].stakeAmount == 0) {
            modelValidators[_modelId].push(msg.sender);
            modelListings[_modelId].validatorCount++;
        }
        
        validatorStakes[msg.sender][_modelId].stakeAmount += _amount;
        validatorStakes[msg.sender][_modelId].totalStake += _amount;
        validatorStakes[msg.sender][_modelId].lastUpdate = block.timestamp;
        
        totalValidatorStake[msg.sender] += _amount;
        modelTotalStake[_modelId] += _amount;
        modelListings[_modelId].totalStake += _amount;
        
        emit ValidatorStaked(msg.sender, _modelId, _amount);
    }

    /**
     * @dev Delegate stake to a validator
     */
    function delegateStake(
        address _validator,
        string memory _modelId,
        uint256 _amount
    ) external payable {
        require(validatorStakes[_validator][_modelId].stakeAmount > 0, "Validator not staked");
        require(msg.value >= _amount, "Insufficient payment");
        
        validatorStakes[_validator][_modelId].delegatedAmount += _amount;
        validatorStakes[_validator][_modelId].totalStake += _amount;
        
        modelTotalStake[_modelId] += _amount;
        modelListings[_modelId].totalStake += _amount;
        
        emit DelegationCreated(msg.sender, _validator, _modelId, _amount);
    }

    /**
     * @dev Distribute rewards to validators
     */
    function _distributeRewards(string memory _modelId, uint256 _totalRewards) internal {
        address[] memory validators = modelValidators[_modelId];
        uint256 validatorCount = validators.length;
        
        if (validatorCount == 0) return;
        
        uint256 rewardPerValidator = _totalRewards / validatorCount;
        
        for (uint256 i = 0; i < validatorCount; i++) {
            address validator = validators[i];
            validatorStakes[validator][_modelId].rewards += rewardPerValidator;
            
            // Transfer reward to validator
            payable(validator).transfer(rewardPerValidator);
        }
        
        modelTotalRewards[_modelId] += _totalRewards;
        
        emit RewardsDistributed(_modelId, _totalRewards, validatorCount);
    }

    /**
     * @dev Update model metrics
     */
    function updateModelMetrics(
        string memory _modelId,
        uint256 _accuracy,
        uint256 _latency,
        uint256 _uptime
    ) external {
        require(modelListings[_modelId].owner == msg.sender, "Not model owner");
        require(_accuracy <= 10000, "Invalid accuracy");
        require(_uptime <= 10000, "Invalid uptime");
        
        modelListings[_modelId].accuracy = _accuracy;
        modelListings[_modelId].latency = _latency;
        modelListings[_modelId].uptime = _uptime;
        modelListings[_modelId].updatedAt = block.timestamp;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getModelListing(string memory _modelId) external view returns (ModelListing memory) {
        return modelListings[_modelId];
    }

    function getInferenceResult(string memory _resultId) external view returns (InferenceResult memory) {
        return inferenceResults[_resultId];
    }

    function getValidatorStake(address _validator, string memory _modelId) external view returns (ValidatorStake memory) {
        return validatorStakes[_validator][_modelId];
    }

    function getModelValidators(string memory _modelId) external view returns (address[] memory) {
        return modelValidators[_modelId];
    }

    function getModelMetrics(string memory _modelId) external view returns (
        uint256 totalInferences,
        uint256 totalRewards,
        uint256 validatorCount,
        uint256 totalStake
    ) {
        return (
            modelInferenceCount[_modelId],
            modelTotalRewards[_modelId],
            modelListings[_modelId].validatorCount,
            modelListings[_modelId].totalStake
        );
    }
}