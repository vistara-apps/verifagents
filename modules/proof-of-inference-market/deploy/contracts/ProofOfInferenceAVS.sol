// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title ProofOfInferenceAVS
 * @dev EigenLayer AVS for ML inference verification with staking and slashing
 * @notice Implements verifiable ML inference with EigenLayer AVS integration
 */
contract ProofOfInferenceAVS is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    
    struct InferenceRequest {
        address agent;
        string modelId;
        bytes inputData;
        bytes expectedOutput;
        uint256 reward;
        uint256 deadline;
        bool completed;
        bool verified;
        uint256 timestamp;
        bytes32 requestHash;
    }
    
    struct VerificationResult {
        address verifier;
        bool isValid;
        uint256 confidence;
        bytes proof;
        uint256 timestamp;
        uint256 gasUsed;
        string verificationMethod;
    }
    
    struct ModelInfo {
        string modelId;
        address owner;
        uint256 verificationFee;
        bool isActive;
        uint256 totalInferences;
        uint256 successfulVerifications;
        uint256 accuracy;
    }
    
    struct ValidatorStake {
        address validator;
        uint256 stakeAmount;
        uint256 delegatedAmount;
        uint256 totalStake;
        uint256 slashingRisk; // 0-10000 (0-100%)
        uint256 rewards;
        uint256 lastUpdate;
        bool isActive;
    }

    // ============ State Variables ============
    
    mapping(uint256 => InferenceRequest) public inferenceRequests;
    mapping(uint256 => VerificationResult[]) public verificationResults;
    mapping(string => ModelInfo) public modelInfo;
    mapping(address => ValidatorStake) public validatorStakes;
    mapping(address => uint256) public agentTrustScores;
    mapping(bytes32 => bool) public usedProofs;
    
    IERC20 public immutable rewardToken;
    address public immutable eigenLayerRegistry;
    address public immutable erc8004Registry;
    
    uint256 public requestCounter = 0;
    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant MAX_SLASHING_PERCENTAGE = 5000; // 50%
    uint256 public constant VERIFICATION_WINDOW = 1 hours;
    uint256 public constant CHALLENGE_WINDOW = 24 hours;
    uint256 public constant MIN_CONSENSUS_VALIDATORS = 3;
    
    // ============ Events ============
    
    event ModelRegistered(string indexed modelId, address indexed owner, uint256 verificationFee);
    event InferenceRequested(uint256 indexed requestId, string indexed modelId, address indexed agent, uint256 reward);
    event VerificationSubmitted(uint256 indexed requestId, address indexed verifier, bool isValid, uint256 confidence);
    event InferenceVerified(uint256 indexed requestId, bool verified, uint256 consensusConfidence);
    event ValidatorStaked(address indexed validator, uint256 amount);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);
    event TrustScoreUpdated(address indexed agent, uint256 newScore);
    event RewardsDistributed(address indexed validator, uint256 amount);

    // ============ Constructor ============
    
    constructor(
        address _rewardToken,
        address _eigenLayerRegistry,
        address _erc8004Registry
    ) {
        rewardToken = IERC20(_rewardToken);
        eigenLayerRegistry = _eigenLayerRegistry;
        erc8004Registry = _erc8004Registry;
    }

    // ============ Core Functions ============
    
    /**
     * @dev Register a new ML model for verification
     */
    function registerModel(
        string memory _modelId,
        uint256 _verificationFee
    ) external {
        require(bytes(modelInfo[_modelId].modelId).length == 0, "Model already registered");
        require(_verificationFee > 0, "Invalid verification fee");
        
        modelInfo[_modelId] = ModelInfo({
            modelId: _modelId,
            owner: msg.sender,
            verificationFee: _verificationFee,
            isActive: true,
            totalInferences: 0,
            successfulVerifications: 0,
            accuracy: 0
        });
        
        emit ModelRegistered(_modelId, msg.sender, _verificationFee);
    }
    
    /**
     * @dev Request ML inference verification
     */
    function requestInferenceVerification(
        string memory _modelId,
        bytes memory _inputData,
        bytes memory _expectedOutput,
        uint256 _reward,
        uint256 _deadline
    ) external payable returns (uint256) {
        require(modelInfo[_modelId].isActive, "Model not active");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_reward > 0, "Invalid reward");
        
        uint256 verificationFee = modelInfo[_modelId].verificationFee;
        require(msg.value >= verificationFee, "Insufficient verification fee");
        
        requestCounter++;
        uint256 requestId = requestCounter;
        
        bytes32 requestHash = keccak256(abi.encodePacked(
            _modelId,
            _inputData,
            _expectedOutput,
            _reward,
            _deadline,
            block.timestamp
        ));
        
        inferenceRequests[requestId] = InferenceRequest({
            agent: msg.sender,
            modelId: _modelId,
            inputData: _inputData,
            expectedOutput: _expectedOutput,
            reward: _reward,
            deadline: _deadline,
            completed: false,
            verified: false,
            timestamp: block.timestamp,
            requestHash: requestHash
        });
        
        modelInfo[_modelId].totalInferences++;
        
        emit InferenceRequested(requestId, _modelId, msg.sender, _reward);
        
        return requestId;
    }
    
    /**
     * @dev Submit verification result (called by validators)
     */
    function submitVerification(
        uint256 _requestId,
        bool _isValid,
        uint256 _confidence,
        bytes memory _proof,
        string memory _verificationMethod
    ) external {
        require(inferenceRequests[_requestId].deadline > block.timestamp, "Request expired");
        require(validatorStakes[msg.sender].isActive, "Not a validator");
        require(_confidence <= 10000, "Invalid confidence");
        
        // Check if already submitted by this validator
        for (uint256 i = 0; i < verificationResults[_requestId].length; i++) {
            require(verificationResults[_requestId][i].verifier != msg.sender, "Already submitted");
        }
        
        verificationResults[_requestId].push(VerificationResult({
            verifier: msg.sender,
            isValid: _isValid,
            confidence: _confidence,
            proof: _proof,
            timestamp: block.timestamp,
            gasUsed: gasleft(),
            verificationMethod: _verificationMethod
        }));
        
        emit VerificationSubmitted(_requestId, msg.sender, _isValid, _confidence);
        
        // Check if we have enough verifications for consensus
        if (verificationResults[_requestId].length >= MIN_CONSENSUS_VALIDATORS) {
            _finalizeVerification(_requestId);
        }
    }
    
    /**
     * @dev Finalize verification with consensus
     */
    function _finalizeVerification(uint256 _requestId) internal {
        VerificationResult[] memory results = verificationResults[_requestId];
        require(results.length >= MIN_CONSENSUS_VALIDATORS, "Insufficient verifications");
        
        uint256 validCount = 0;
        uint256 totalConfidence = 0;
        
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].isValid) {
                validCount++;
            }
            totalConfidence += results[i].confidence;
        }
        
        bool consensus = validCount > results.length / 2;
        uint256 consensusConfidence = totalConfidence / results.length;
        
        inferenceRequests[_requestId].completed = true;
        inferenceRequests[_requestId].verified = consensus;
        
        if (consensus) {
            // Update model accuracy
            string memory modelId = inferenceRequests[_requestId].modelId;
            modelInfo[modelId].successfulVerifications++;
            modelInfo[modelId].accuracy = (modelInfo[modelId].successfulVerifications * 10000) / modelInfo[modelId].totalInferences;
            
            // Distribute rewards to validators
            _distributeRewards(_requestId, results);
            
            // Update agent trust score
            _updateAgentTrustScore(inferenceRequests[_requestId].agent, true);
        } else {
            // Slash validators who voted incorrectly
            _slashIncorrectValidators(_requestId, results);
            _updateAgentTrustScore(inferenceRequests[_requestId].agent, false);
        }
        
        emit InferenceVerified(_requestId, consensus, consensusConfidence);
    }
    
    /**
     * @dev Distribute rewards to validators
     */
    function _distributeRewards(uint256 _requestId, VerificationResult[] memory _results) internal {
        uint256 totalReward = inferenceRequests[_requestId].reward;
        uint256 rewardPerValidator = totalReward / _results.length;
        
        for (uint256 i = 0; i < _results.length; i++) {
            address validator = _results[i].verifier;
            validatorStakes[validator].rewards += rewardPerValidator;
            
            // Transfer reward
            payable(validator).transfer(rewardPerValidator);
            
            emit RewardsDistributed(validator, rewardPerValidator);
        }
    }
    
    /**
     * @dev Slash validators who voted incorrectly
     */
    function _slashIncorrectValidators(uint256 _requestId, VerificationResult[] memory _results) internal {
        bool consensus = false;
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < _results.length; i++) {
            if (_results[i].isValid) {
                validCount++;
            }
        }
        consensus = validCount > _results.length / 2;
        
        for (uint256 i = 0; i < _results.length; i++) {
            if (_results[i].isValid != consensus) {
                // Slash validator
                uint256 slashAmount = (validatorStakes[_results[i].verifier].stakeAmount * 1000) / 10000; // 10% slash
                validatorStakes[_results[i].verifier].stakeAmount -= slashAmount;
                validatorStakes[_results[i].verifier].slashingRisk += 1000; // Increase risk
                
                emit ValidatorSlashed(_results[i].verifier, slashAmount, "Incorrect verification");
            }
        }
    }
    
    /**
     * @dev Update agent trust score
     */
    function _updateAgentTrustScore(address _agent, bool _success) internal {
        uint256 currentScore = agentTrustScores[_agent];
        
        if (_success) {
            // Increase trust score (capped at 1000)
            agentTrustScores[_agent] = currentScore + 10 > 1000 ? 1000 : currentScore + 10;
        } else {
            // Decrease trust score (capped at 0)
            agentTrustScores[_agent] = currentScore < 10 ? 0 : currentScore - 10;
        }
        
        emit TrustScoreUpdated(_agent, agentTrustScores[_agent]);
    }

    // ============ Validator Functions ============
    
    /**
     * @dev Stake as validator
     */
    function stakeValidator() external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        
        if (validatorStakes[msg.sender].stakeAmount == 0) {
            validatorStakes[msg.sender].isActive = true;
        }
        
        validatorStakes[msg.sender].stakeAmount += msg.value;
        validatorStakes[msg.sender].totalStake += msg.value;
        validatorStakes[msg.sender].lastUpdate = block.timestamp;
        
        emit ValidatorStaked(msg.sender, msg.value);
    }
    
    /**
     * @dev Unstake validator
     */
    function unstakeValidator(uint256 _amount) external {
        require(validatorStakes[msg.sender].stakeAmount >= _amount, "Insufficient stake");
        require(validatorStakes[msg.sender].isActive, "Not a validator");
        
        validatorStakes[msg.sender].stakeAmount -= _amount;
        validatorStakes[msg.sender].totalStake -= _amount;
        
        if (validatorStakes[msg.sender].stakeAmount == 0) {
            validatorStakes[msg.sender].isActive = false;
        }
        
        payable(msg.sender).transfer(_amount);
    }
    
    /**
     * @dev Claim rewards
     */
    function claimRewards() external {
        uint256 rewards = validatorStakes[msg.sender].rewards;
        require(rewards > 0, "No rewards to claim");
        
        validatorStakes[msg.sender].rewards = 0;
        payable(msg.sender).transfer(rewards);
    }

    // ============ View Functions ============
    
    function getInferenceRequest(uint256 _requestId) external view returns (InferenceRequest memory) {
        return inferenceRequests[_requestId];
    }
    
    function getVerificationResults(uint256 _requestId) external view returns (VerificationResult[] memory) {
        return verificationResults[_requestId];
    }
    
    function getModelInfo(string memory _modelId) external view returns (ModelInfo memory) {
        return modelInfo[_modelId];
    }
    
    function getValidatorStake(address _validator) external view returns (ValidatorStake memory) {
        return validatorStakes[_validator];
    }
    
    function getAgentTrustScore(address _agent) external view returns (uint256) {
        return agentTrustScores[_agent];
    }
    
    function isRequestVerified(uint256 _requestId) external view returns (bool) {
        return inferenceRequests[_requestId].verified;
    }

    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}