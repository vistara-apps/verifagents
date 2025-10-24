// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ProofOfInferenceAVS
 * @notice EigenLayer AVS for verifying ML inference work and creating a market for inference verification
 * @dev Integrates with 4Mica payments and ERC-8004 receipts for autonomous agent ML verification
 */
contract ProofOfInferenceAVS is ReentrancyGuard, Ownable {
    
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
    
    // ============ State Variables ============
    
    // Mapping from request ID to inference request
    mapping(uint256 => InferenceRequest) public inferenceRequests;
    
    // Mapping from request ID to verification results
    mapping(uint256 => VerificationResult[]) public verificationResults;
    
    // Mapping from model ID to model info
    mapping(string => ModelInfo) public models;
    
    // Whitelisted verifiers (EigenLayer operators)
    mapping(address => bool) public verifiers;
    
    // Agent trust scores (from ERC-8004 receipts)
    mapping(address => uint256) public agentTrustScores;
    
    // Payment token (USDC or ETH)
    IERC20 public paymentToken;
    
    // 4Mica integration for payments
    address public fourMicaAddress;
    
    // ERC-8004 receipt contract
    address public erc8004Address;
    
    // Request counter
    uint256 public requestCounter;
    
    // Verification fee (in basis points, e.g., 100 = 1%)
    uint256 public verificationFeeBps = 50; // 0.5%
    
    // Minimum stake required for verifiers
    uint256 public minStake = 1 ether;
    
    // ============ Events ============
    
    event InferenceRequested(
        uint256 indexed requestId,
        address indexed agent,
        string modelId,
        uint256 reward,
        uint256 deadline,
        bytes32 requestHash
    );
    
    event VerificationSubmitted(
        uint256 indexed requestId,
        address indexed verifier,
        bool isValid,
        uint256 confidence,
        string verificationMethod
    );
    
    event InferenceVerified(
        uint256 indexed requestId,
        bool finalResult,
        uint256 totalVerifiers,
        uint256 consensusConfidence
    );
    
    event ModelRegistered(
        string indexed modelId,
        address indexed owner,
        uint256 verificationFee
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    event PaymentProcessed(
        uint256 indexed requestId,
        address indexed agent,
        uint256 amount,
        address token
    );
    
    // ============ Modifiers ============
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not authorized verifier");
        _;
    }
    
    modifier validRequest(uint256 requestId) {
        require(requestId < requestCounter, "Invalid request ID");
        require(!inferenceRequests[requestId].completed, "Request already completed");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _paymentToken,
        address _fourMicaAddress,
        address _erc8004Address
    ) {
        paymentToken = IERC20(_paymentToken);
        fourMicaAddress = _fourMicaAddress;
        erc8004Address = _erc8004Address;
        verifiers[msg.sender] = true;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Request ML inference verification
     * @param modelId Model identifier
     * @param inputData Input data for inference
     * @param expectedOutput Expected output (for verification)
     * @param reward Reward for successful verification
     * @param deadline Deadline for verification
     */
    function requestInferenceVerification(
        string memory modelId,
        bytes memory inputData,
        bytes memory expectedOutput,
        uint256 reward,
        uint256 deadline
    ) external payable nonReentrant returns (uint256) {
        require(models[modelId].isActive, "Model not active");
        require(reward > 0, "Reward must be positive");
        require(deadline > block.timestamp, "Invalid deadline");
        require(inputData.length > 0, "Input data required");
        
        uint256 requestId = requestCounter++;
        bytes32 requestHash = keccak256(abi.encodePacked(
            msg.sender,
            modelId,
            inputData,
            expectedOutput,
            reward,
            deadline,
            block.timestamp
        ));
        
        inferenceRequests[requestId] = InferenceRequest({
            agent: msg.sender,
            modelId: modelId,
            inputData: inputData,
            expectedOutput: expectedOutput,
            reward: reward,
            deadline: deadline,
            completed: false,
            verified: false,
            timestamp: block.timestamp,
            requestHash: requestHash
        });
        
        // Transfer payment to contract
        if (address(paymentToken) == address(0)) {
            require(msg.value >= reward, "Insufficient payment");
        } else {
            require(paymentToken.transferFrom(msg.sender, address(this), reward), "Payment failed");
        }
        
        emit InferenceRequested(
            requestId,
            msg.sender,
            modelId,
            reward,
            deadline,
            requestHash
        );
        
        return requestId;
    }
    
    /**
     * @notice Submit verification result
     * @param requestId Request ID
     * @param isValid Whether the inference is valid
     * @param confidence Confidence score (0-100)
     * @param proof Verification proof
     * @param verificationMethod Method used for verification
     */
    function submitVerification(
        uint256 requestId,
        bool isValid,
        uint256 confidence,
        bytes memory proof,
        string memory verificationMethod
    ) external onlyVerifier validRequest(requestId) {
        require(confidence <= 100, "Invalid confidence score");
        require(proof.length > 0, "Proof required");
        
        VerificationResult memory result = VerificationResult({
            verifier: msg.sender,
            isValid: isValid,
            confidence: confidence,
            proof: proof,
            timestamp: block.timestamp,
            gasUsed: gasleft(),
            verificationMethod: verificationMethod
        });
        
        verificationResults[requestId].push(result);
        
        emit VerificationSubmitted(
            requestId,
            msg.sender,
            isValid,
            confidence,
            verificationMethod
        );
        
        // Check if we have enough verifications for consensus
        if (verificationResults[requestId].length >= 3) {
            _finalizeVerification(requestId);
        }
    }
    
    /**
     * @notice Finalize verification based on consensus
     * @param requestId Request ID
     */
    function _finalizeVerification(uint256 requestId) internal {
        InferenceRequest storage request = inferenceRequests[requestId];
        require(!request.completed, "Already completed");
        
        VerificationResult[] memory results = verificationResults[requestId];
        require(results.length >= 3, "Insufficient verifications");
        
        // Calculate consensus
        uint256 validCount = 0;
        uint256 totalConfidence = 0;
        
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].isValid) {
                validCount++;
            }
            totalConfidence += results[i].confidence;
        }
        
        bool finalResult = validCount > results.length / 2;
        uint256 consensusConfidence = totalConfidence / results.length;
        
        request.completed = true;
        request.verified = finalResult;
        
        // Update model stats
        models[request.modelId].totalInferences++;
        if (finalResult) {
            models[request.modelId].successfulVerifications++;
        }
        
        // Update agent trust score
        if (finalResult) {
            agentTrustScores[request.agent] += 10; // Reward for successful verification
        } else {
            agentTrustScores[request.agent] = agentTrustScores[request.agent] > 5 ? 
                agentTrustScores[request.agent] - 5 : 0; // Penalty for failed verification
        }
        
        // Process payment
        if (finalResult) {
            _processPayment(requestId, request.agent, request.reward);
        }
        
        emit InferenceVerified(
            requestId,
            finalResult,
            results.length,
            consensusConfidence
        );
        
        // Create ERC-8004 receipt
        _createReceipt(requestId, finalResult, consensusConfidence);
    }
    
    /**
     * @notice Process payment to agent
     * @param requestId Request ID
     * @param agent Agent address
     * @param amount Payment amount
     */
    function _processPayment(
        uint256 requestId,
        address agent,
        uint256 amount
    ) internal {
        // Calculate verification fees
        uint256 verificationFee = (amount * verificationFeeBps) / 10000;
        uint256 agentPayment = amount - verificationFee;
        
        // Transfer payment to agent
        if (address(paymentToken) == address(0)) {
            payable(agent).transfer(agentPayment);
        } else {
            require(paymentToken.transfer(agent, agentPayment), "Payment failed");
        }
        
        emit PaymentProcessed(requestId, agent, agentPayment, address(paymentToken));
    }
    
    /**
     * @notice Create ERC-8004 receipt for verification
     * @param requestId Request ID
     * @param verified Whether verification was successful
     * @param confidence Consensus confidence
     */
    function _createReceipt(
        uint256 requestId,
        bool verified,
        uint256 confidence
    ) internal {
        // This would call the ERC-8004 contract to create a receipt
        // For now, we'll emit an event
        emit InferenceVerified(requestId, verified, 0, confidence);
    }
    
    // ============ Model Management ============
    
    /**
     * @notice Register a new ML model
     * @param modelId Model identifier
     * @param verificationFee Fee for verification
     */
    function registerModel(
        string memory modelId,
        uint256 verificationFee
    ) external {
        require(bytes(modelId).length > 0, "Model ID required");
        require(verificationFee > 0, "Verification fee required");
        require(!models[modelId].isActive, "Model already registered");
        
        models[modelId] = ModelInfo({
            modelId: modelId,
            owner: msg.sender,
            verificationFee: verificationFee,
            isActive: true,
            totalInferences: 0,
            successfulVerifications: 0,
            accuracy: 0
        });
        
        emit ModelRegistered(modelId, msg.sender, verificationFee);
    }
    
    /**
     * @notice Update model accuracy
     * @param modelId Model identifier
     */
    function updateModelAccuracy(string memory modelId) external {
        ModelInfo storage model = models[modelId];
        require(model.isActive, "Model not active");
        require(model.totalInferences > 0, "No inferences yet");
        
        model.accuracy = (model.successfulVerifications * 100) / model.totalInferences;
    }
    
    // ============ Verifier Management ============
    
    /**
     * @notice Add verifier
     * @param verifier Verifier address
     */
    function addVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    /**
     * @notice Remove verifier
     * @param verifier Verifier address
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get verification results for a request
     * @param requestId Request ID
     * @return results Array of verification results
     */
    function getVerificationResults(uint256 requestId) 
        external 
        view 
        returns (VerificationResult[] memory) 
    {
        return verificationResults[requestId];
    }
    
    /**
     * @notice Get model information
     * @param modelId Model identifier
     * @return model Model information
     */
    function getModelInfo(string memory modelId) 
        external 
        view 
        returns (ModelInfo memory) 
    {
        return models[modelId];
    }
    
    /**
     * @notice Get agent trust score
     * @param agent Agent address
     * @return score Trust score
     */
    function getAgentTrustScore(address agent) external view returns (uint256) {
        return agentTrustScores[agent];
    }
    
    /**
     * @notice Check if request is verified
     * @param requestId Request ID
     * @return verified True if verified
     */
    function isRequestVerified(uint256 requestId) external view returns (bool) {
        return inferenceRequests[requestId].verified;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set verification fee
     * @param feeBps Fee in basis points
     */
    function setVerificationFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee too high"); // Max 10%
        verificationFeeBps = feeBps;
    }
    
    /**
     * @notice Set minimum stake
     * @param stake Minimum stake amount
     */
    function setMinStake(uint256 stake) external onlyOwner {
        minStake = stake;
    }
    
    /**
     * @notice Withdraw fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        if (address(paymentToken) == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            require(paymentToken.transfer(owner(), amount), "Withdrawal failed");
        }
    }
}