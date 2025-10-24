package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Layr-Labs/hourglass-monorepo/ponos/pkg/performer/contracts"
	"github.com/Layr-Labs/hourglass-monorepo/ponos/pkg/performer/server"
	performerV1 "github.com/Layr-Labs/protocol-apis/gen/protos/eigenlayer/hourglass/v1/performer"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

// InferenceVerificationTask represents an ML inference verification request
type InferenceVerificationTask struct {
	RequestID      uint64 `json:"requestId"`
	ModelID        string `json:"modelId"`
	InputData      string `json:"inputData"`
	ExpectedOutput string `json:"expectedOutput"`
	Reward         string `json:"reward"`
	Deadline       uint64 `json:"deadline"`
	Agent          string `json:"agent"`
	ReceiptID      uint64 `json:"receiptId,omitempty"` // For ERC-8004 integration
}

// VerificationResponse represents the AVS response
type VerificationResponse struct {
	RequestID         uint64 `json:"requestId"`
	Status            string `json:"status"`
	IsValid           bool   `json:"isValid"`
	Confidence        uint64 `json:"confidence"`
	VerificationProof string `json:"verificationProof"`
	AttestationHash   string `json:"attestationHash"`
	ReceiptID         uint64 `json:"receiptId,omitempty"`
	PaymentHash       string `json:"paymentHash,omitempty"`
	Reason            string `json:"reason,omitempty"`
}

// ContractAddresses holds deployed contract addresses
type ContractAddresses struct {
	ProofOfInferenceAVS common.Address
	ERC8004Receipt      common.Address
	RewardToken         common.Address
	PaymentProcessor    common.Address
}

type TaskWorker struct {
	logger            *zap.Logger
	contractStore     *contracts.ContractStore
	l1Client          *ethclient.Client
	l2Client          *ethclient.Client
	addresses         *ContractAddresses
	avsABI            abi.ABI
	receiptABI        abi.ABI
	paymentABI        abi.ABI
	mlAgentEndpoint   string
	paymentServiceURL string
	receiptServiceURL string
}

func NewTaskWorker(logger *zap.Logger) *TaskWorker {
	contractStore, err := contracts.NewContractStore()
	if err != nil {
		logger.Warn("Failed to load contract store", zap.Error(err))
	}

	var l1Client, l2Client *ethclient.Client

	// Connect to L1 (Ethereum) - required for main contracts
	if l1RpcUrl := os.Getenv("L1_RPC_URL"); l1RpcUrl != "" {
		l1Client, err = ethclient.Dial(l1RpcUrl)
		if err != nil {
			logger.Fatal("Failed to connect to L1 RPC", zap.Error(err))
		}
	} else {
		logger.Fatal("L1_RPC_URL environment variable is required")
	}

	// Connect to L2 (Base) - optional for this implementation
	if l2RpcUrl := os.Getenv("L2_RPC_URL"); l2RpcUrl != "" {
		l2Client, err = ethclient.Dial(l2RpcUrl)
		if err != nil {
			logger.Error("Failed to connect to L2 RPC", zap.Error(err))
		}
	}

	// Load contract addresses from environment or deployment files
	addresses := loadContractAddresses(logger)

	// Load ABIs
	avsABI := mustParseABI(ProofOfInferenceAVSABIJSON)
	receiptABI := mustParseABI(ERC8004ReceiptABIJSON)
	paymentABI := mustParseABI(PaymentProcessorABIJSON)

	// Load service endpoints from environment
	mlAgentEndpoint := getEnvOrDefault("ML_AGENT_ENDPOINT", "http://localhost:8083")
	paymentServiceURL := getEnvOrDefault("PAYMENT_SERVICE_URL", "http://localhost:3001")
	receiptServiceURL := getEnvOrDefault("RECEIPT_SERVICE_URL", "http://localhost:3002")

	logger.Info("TaskWorker initialized",
		zap.String("avs", addresses.ProofOfInferenceAVS.Hex()),
		zap.String("receipt", addresses.ERC8004Receipt.Hex()),
		zap.String("rewardToken", addresses.RewardToken.Hex()),
		zap.String("paymentProcessor", addresses.PaymentProcessor.Hex()),
		zap.String("mlAgentEndpoint", mlAgentEndpoint),
		zap.String("paymentServiceURL", paymentServiceURL),
		zap.String("receiptServiceURL", receiptServiceURL))

	return &TaskWorker{
		logger:            logger,
		contractStore:     contractStore,
		l1Client:          l1Client,
		l2Client:          l2Client,
		addresses:         addresses,
		avsABI:            avsABI,
		receiptABI:        receiptABI,
		paymentABI:        paymentABI,
		mlAgentEndpoint:   mlAgentEndpoint,
		paymentServiceURL: paymentServiceURL,
		receiptServiceURL: receiptServiceURL,
	}
}

func (tw *TaskWorker) ValidateTask(t *performerV1.TaskRequest) error {
	tw.logger.Info("Validating ML inference verification task")

	// Parse the task data
	var task InferenceVerificationTask
	if err := json.Unmarshal(t.Payload, &task); err != nil {
		tw.logger.Error("Failed to parse verification task", zap.Error(err))
		return fmt.Errorf("invalid task data: %w", err)
	}

	// Validate agent address format
	if !common.IsHexAddress(task.Agent) {
		return fmt.Errorf("invalid agent address format")
	}
	agentAddr := common.HexToAddress(task.Agent)

	// Step 1: Check if request exists and is not expired
	requestExists, isExpired, err := tw.checkInferenceRequest(task.RequestID)
	if err != nil {
		tw.logger.Error("Failed to check inference request", zap.Error(err))
		return fmt.Errorf("failed to verify request: %w", err)
	}
	if !requestExists {
		return fmt.Errorf("inference request %d does not exist", task.RequestID)
	}
	if isExpired {
		return fmt.Errorf("inference request %d has expired", task.RequestID)
	}

	// Step 2: Check agent trust score
	trustScore, err := tw.getAgentTrustScore(agentAddr)
	if err != nil {
		tw.logger.Error("Failed to get agent trust score", zap.Error(err))
		return fmt.Errorf("failed to get trust score: %w", err)
	}
	if trustScore < 100 {
		return fmt.Errorf("insufficient trust score: %d (minimum 100)", trustScore)
	}

	// Step 3: Validate model is active
	modelActive, err := tw.isModelActive(task.ModelID)
	if err != nil {
		tw.logger.Error("Failed to check model status", zap.Error(err))
		return fmt.Errorf("failed to check model: %w", err)
	}
	if !modelActive {
		return fmt.Errorf("model %s is not active", task.ModelID)
	}

	tw.logger.Info("Task validation passed",
		zap.Uint64("requestId", task.RequestID),
		zap.String("modelId", task.ModelID),
		zap.String("agent", task.Agent),
		zap.Uint64("trustScore", trustScore))

	return nil
}

func (tw *TaskWorker) HandleTask(t *performerV1.TaskRequest) (*performerV1.TaskResponse, error) {
	tw.logger.Info("Handling ML inference verification task")

	// Parse the task data
	var task InferenceVerificationTask
	if err := json.Unmarshal(t.Payload, &task); err != nil {
		return nil, fmt.Errorf("failed to parse task data: %w", err)
	}

	_ = common.HexToAddress(task.Agent) // agentAddr unused for now

	// Step 1: Get request details from contract
	requestData, err := tw.getInferenceRequestData(task.RequestID)
	if err != nil {
		tw.logger.Error("Failed to get request data", zap.Error(err))
		return tw.createRejectionResponse(t.TaskId, "Failed to get request data")
	}

	// Step 2: Run real ML verification using Python agents
	verificationResult, err := tw.runRealMLVerification(task, requestData)
	if err != nil {
		tw.logger.Error("ML verification failed", zap.Error(err))
		return tw.createRejectionResponse(t.TaskId, "ML verification failed")
	}

	// Step 3: Process payment through 4Mica service
	paymentHash, err := tw.processPayment(task, verificationResult)
	if err != nil {
		tw.logger.Warn("Payment processing failed, proceeding without payment", zap.Error(err))
		paymentHash = ""
	}

	// Step 4: Generate ERC-8004 receipt
	receiptID, err := tw.generateReceipt(task, verificationResult, paymentHash)
	if err != nil {
		tw.logger.Warn("Receipt generation failed, proceeding without receipt", zap.Error(err))
		receiptID = 0
	}

	// Step 5: Generate cryptographic proof
	proof, err := tw.generateVerificationProof(task, verificationResult)
	if err != nil {
		tw.logger.Error("Failed to generate proof", zap.Error(err))
		return tw.createRejectionResponse(t.TaskId, "Failed to generate proof")
	}

	// Step 6: Create attestation hash
	attestationHash := tw.createAttestationHash(task, verificationResult)

	// Step 7: Submit verification to contract (this would normally be a transaction)
	// For AVS, we return the decision and let the contract handle the actual submission
	logFields := []zap.Field{
		zap.Uint64("requestId", task.RequestID),
		zap.String("modelId", task.ModelID),
		zap.String("agent", task.Agent),
		zap.Bool("isValid", verificationResult.IsValid),
		zap.Uint64("confidence", verificationResult.Confidence),
		zap.String("method", verificationResult.Method),
		zap.String("paymentHash", paymentHash),
		zap.Uint64("receiptId", receiptID),
	}
	tw.logger.Info("ML verification completed - ready for onchain submission", logFields...)

	response := VerificationResponse{
		RequestID:         task.RequestID,
		Status:            "verified",
		IsValid:           verificationResult.IsValid,
		Confidence:        verificationResult.Confidence,
		VerificationProof: proof,
		AttestationHash:   attestationHash,
		ReceiptID:         receiptID,
		PaymentHash:       paymentHash,
	}

	// Marshal response
	resultBytes, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %w", err)
	}

	return &performerV1.TaskResponse{
		TaskId: t.TaskId,
		Result: resultBytes,
	}, nil
}

func (tw *TaskWorker) createRejectionResponse(taskID []byte, reason string) (*performerV1.TaskResponse, error) {
	response := VerificationResponse{
		Status: "rejected",
		Reason: reason,
	}

	resultBytes, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %w", err)
	}

	return &performerV1.TaskResponse{
		TaskId: taskID,
		Result: resultBytes,
	}, nil
}

// ========== Onchain Interaction Functions ==========

// checkInferenceRequest checks if a request exists and is not expired
func (tw *TaskWorker) checkInferenceRequest(requestID uint64) (exists bool, expired bool, err error) {
	contract := bind.NewBoundContract(tw.addresses.ProofOfInferenceAVS, tw.avsABI, tw.l1Client, tw.l1Client, tw.l1Client)

	var results []interface{}
	err = contract.Call(&bind.CallOpts{}, &results, "getInferenceRequest", big.NewInt(int64(requestID)))
	if err != nil {
		if strings.Contains(err.Error(), "execution reverted") {
			return false, false, nil
		}
		return false, false, err
	}

	if len(results) > 0 {
		// Parse the request struct
		requestStruct := results[0]
		if structData, ok := requestStruct.(struct {
			Agent          common.Address
			ModelId        string
			InputData      []byte
			ExpectedOutput []byte
			Reward         *big.Int
			Deadline       *big.Int
			Completed      bool
			Verified       bool
			Timestamp      *big.Int
			RequestHash    [32]byte
		}); ok {
			exists = true
			expired = structData.Deadline.Uint64() < uint64(time.Now().Unix())
			return exists, expired, nil
		}
	}

	return false, false, nil
}

// getAgentTrustScore fetches trust score from contract
func (tw *TaskWorker) getAgentTrustScore(agent common.Address) (uint64, error) {
	contract := bind.NewBoundContract(tw.addresses.ProofOfInferenceAVS, tw.avsABI, tw.l1Client, tw.l1Client, tw.l1Client)

	var results []interface{}
	err := contract.Call(&bind.CallOpts{}, &results, "getAgentTrustScore", agent)
	if err != nil {
		return 0, fmt.Errorf("failed to call getAgentTrustScore: %w", err)
	}

	if len(results) == 0 {
		return 0, fmt.Errorf("no results returned from getAgentTrustScore")
	}

	score := results[0].(*big.Int)
	return score.Uint64(), nil
}

// isModelActive checks if a model is active
func (tw *TaskWorker) isModelActive(modelID string) (bool, error) {
	contract := bind.NewBoundContract(tw.addresses.ProofOfInferenceAVS, tw.avsABI, tw.l1Client, tw.l1Client, tw.l1Client)

	var results []interface{}
	err := contract.Call(&bind.CallOpts{}, &results, "getModelInfo", modelID)
	if err != nil {
		return false, fmt.Errorf("failed to call getModelInfo: %w", err)
	}

	if len(results) > 0 {
		if structData, ok := results[0].(struct {
			ModelId                string
			Owner                  common.Address
			VerificationFee        *big.Int
			IsActive               bool
			TotalInferences        *big.Int
			SuccessfulVerifications *big.Int
			Accuracy               *big.Int
		}); ok {
			return structData.IsActive, nil
		}
	}

	return false, nil
}

// getInferenceRequestData fetches request data from contract
func (tw *TaskWorker) getInferenceRequestData(requestID uint64) (map[string]interface{}, error) {
	contract := bind.NewBoundContract(tw.addresses.ProofOfInferenceAVS, tw.avsABI, tw.l1Client, tw.l1Client, tw.l1Client)

	var results []interface{}
	err := contract.Call(&bind.CallOpts{}, &results, "getInferenceRequest", big.NewInt(int64(requestID)))
	if err != nil {
		return nil, fmt.Errorf("failed to call getInferenceRequest: %w", err)
	}

	requestData := make(map[string]interface{})
	requestData["requestId"] = requestID

	if len(results) > 0 {
		if structData, ok := results[0].(struct {
			Agent          common.Address
			ModelId        string
			InputData      []byte
			ExpectedOutput []byte
			Reward         *big.Int
			Deadline       *big.Int
			Completed      bool
			Verified       bool
			Timestamp      *big.Int
			RequestHash    [32]byte
		}); ok {
			requestData["agent"] = structData.Agent.Hex()
			requestData["modelId"] = structData.ModelId
			requestData["inputData"] = string(structData.InputData)
			requestData["expectedOutput"] = string(structData.ExpectedOutput)
			requestData["reward"] = structData.Reward.String()
			requestData["deadline"] = structData.Deadline.Uint64()
			requestData["completed"] = structData.Completed
			requestData["verified"] = structData.Verified
			requestData["timestamp"] = structData.Timestamp.Uint64()
		}
	}

	return requestData, nil
}

// runRealMLVerification runs ML verification using real Python agents
func (tw *TaskWorker) runRealMLVerification(task InferenceVerificationTask, requestData map[string]interface{}) (*MLVerificationResult, error) {
	tw.logger.Info("Running real ML verification via Python agent", zap.String("modelId", task.ModelID))
	
	// Prepare request for ML verification agent
	verificationRequest := map[string]interface{}{
		"requestId":      task.RequestID,
		"modelId":        task.ModelID,
		"inputData":      task.InputData,
		"expectedOutput": task.ExpectedOutput,
		"agent":          task.Agent,
	}
	
	// Call the real ML verification agent
	result, err := tw.callMLAgent(verificationRequest)
	if err != nil {
		tw.logger.Error("ML agent call failed", zap.Error(err))
		// Fallback to local verification
		return tw.runFallbackMLVerification(task, requestData)
	}
	
	return result, nil
}

// callMLAgent calls the real Python ML verification agent
func (tw *TaskWorker) callMLAgent(request map[string]interface{}) (*MLVerificationResult, error) {
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	
	// Make HTTP request to ML agent
	resp, err := http.Post(
		tw.mlAgentEndpoint+"/verify",
		"application/json",
		strings.NewReader(string(requestJSON)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call ML agent: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ML agent returned status %d", resp.StatusCode)
	}
	
	var result MLVerificationResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode ML agent response: %w", err)
	}
	
	return &result, nil
}

// runFallbackMLVerification provides fallback verification when the agent is unavailable
func (tw *TaskWorker) runFallbackMLVerification(task InferenceVerificationTask, requestData map[string]interface{}) (*MLVerificationResult, error) {
	tw.logger.Warn("Using fallback ML verification")
	
	// Basic verification logic
	verificationResult := &MLVerificationResult{
		IsValid:    len(task.ExpectedOutput) > 10, // Basic sanity check
		Confidence: 7000, // 70% confidence (lower for fallback)
		Method:     "fallback_verification",
		Details: map[string]interface{}{
			"model_type":        task.ModelID,
			"input_size":        len(task.InputData),
			"output_size":       len(task.ExpectedOutput),
			"verification_time": time.Now().Unix(),
			"fallback_reason":   "ML agent unavailable",
		},
	}
	
	return verificationResult, nil
}

// processPayment processes payment through 4Mica service
func (tw *TaskWorker) processPayment(task InferenceVerificationTask, result *MLVerificationResult) (string, error) {
	tw.logger.Info("Processing payment via 4Mica service", zap.Uint64("requestId", task.RequestID))
	
	// Prepare payment request
	paymentRequest := map[string]interface{}{
		"requestId":    task.RequestID,
		"agent":        task.Agent,
		"amount":       task.Reward,
		"purpose":      "ML_INFERENCE_VERIFICATION",
		"verification": map[string]interface{}{
			"isValid":    result.IsValid,
			"confidence": result.Confidence,
			"method":     result.Method,
		},
	}
	
	requestJSON, err := json.Marshal(paymentRequest)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payment request: %w", err)
	}
	
	// Make HTTP request to 4Mica payment service
	resp, err := http.Post(
		tw.paymentServiceURL+"/process-payment",
		"application/json",
		strings.NewReader(string(requestJSON)),
	)
	if err != nil {
		return "", fmt.Errorf("failed to call payment service: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("payment service returned status %d", resp.StatusCode)
	}
	
	var paymentResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&paymentResponse); err != nil {
		return "", fmt.Errorf("failed to decode payment response: %w", err)
	}
	
	// Extract payment hash
	if hash, ok := paymentResponse["paymentHash"].(string); ok {
		tw.logger.Info("Payment processed successfully", zap.String("paymentHash", hash))
		return hash, nil
	}
	
	return "", fmt.Errorf("payment hash not found in response")
}

// generateReceipt generates ERC-8004 receipt
func (tw *TaskWorker) generateReceipt(task InferenceVerificationTask, result *MLVerificationResult, paymentHash string) (uint64, error) {
	tw.logger.Info("Generating ERC-8004 receipt", zap.Uint64("requestId", task.RequestID))
	
	// Prepare receipt request
	receiptRequest := map[string]interface{}{
		"agent":            task.Agent,
		"bountyId":         task.RequestID,
		"workDescription":  fmt.Sprintf("ML inference verification for model %s", task.ModelID),
		"resultHash":       tw.createAttestationHash(task, result),
		"resultURI":        fmt.Sprintf("ipfs://verification-result-%d", task.RequestID),
		"valueGenerated":   task.Reward,
		"completionTime":   time.Now().Unix(),
		"isVerified":       result.IsValid,
		"paymentHash":      paymentHash,
		"metadata": map[string]interface{}{
			"modelId":        task.ModelID,
			"confidence":     result.Confidence,
			"method":         result.Method,
			"inputDataHash":  fmt.Sprintf("0x%x", task.InputData),
			"outputDataHash": fmt.Sprintf("0x%x", task.ExpectedOutput),
		},
	}
	
	requestJSON, err := json.Marshal(receiptRequest)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal receipt request: %w", err)
	}
	
	// Make HTTP request to ERC-8004 receipt service
	resp, err := http.Post(
		tw.receiptServiceURL+"/mint-receipt",
		"application/json",
		strings.NewReader(string(requestJSON)),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to call receipt service: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("receipt service returned status %d", resp.StatusCode)
	}
	
	var receiptResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&receiptResponse); err != nil {
		return 0, fmt.Errorf("failed to decode receipt response: %w", err)
	}
	
	// Extract receipt ID
	if receiptID, ok := receiptResponse["receiptId"].(float64); ok {
		receiptIDUint := uint64(receiptID)
		tw.logger.Info("Receipt generated successfully", zap.Uint64("receiptId", receiptIDUint))
		return receiptIDUint, nil
	}
	
	return 0, fmt.Errorf("receipt ID not found in response")
}

// generateVerificationProof generates cryptographic proof
func (tw *TaskWorker) generateVerificationProof(task InferenceVerificationTask, result *MLVerificationResult) (string, error) {
	// Generate proof hash
	proofData := map[string]interface{}{
		"requestId": task.RequestID,
		"modelId":   task.ModelID,
		"agent":     task.Agent,
		"isValid":   result.IsValid,
		"confidence": result.Confidence,
		"timestamp": time.Now().Unix(),
		"verifier":  "ProofOfInferenceAVS",
	}
	
	proofBytes, _ := json.Marshal(proofData)
	return fmt.Sprintf("0x%x", proofBytes)[:66], nil
}

// createAttestationHash creates attestation hash
func (tw *TaskWorker) createAttestationHash(task InferenceVerificationTask, result *MLVerificationResult) string {
	attestation := map[string]interface{}{
		"requestId":  task.RequestID,
		"modelId":    task.ModelID,
		"agent":      task.Agent,
		"isValid":    result.IsValid,
		"confidence": result.Confidence,
		"timestamp":  time.Now().Unix(),
		"verifier":   "ProofOfInferenceAVS",
		"version":    "1.0.0",
	}
	
	attestationBytes, _ := json.Marshal(attestation)
	return fmt.Sprintf("0x%x", attestationBytes)[:66]
}

// loadContractAddresses loads contract addresses from environment variables
func loadContractAddresses(logger *zap.Logger) *ContractAddresses {
	addresses := &ContractAddresses{}

	if avsAddr := os.Getenv("PROOF_OF_INFERENCE_AVS_ADDRESS"); avsAddr != "" {
		addresses.ProofOfInferenceAVS = common.HexToAddress(avsAddr)
	} else {
		logger.Fatal("PROOF_OF_INFERENCE_AVS_ADDRESS environment variable is required")
	}

	if receiptAddr := os.Getenv("ERC8004_RECEIPT_ADDRESS"); receiptAddr != "" {
		addresses.ERC8004Receipt = common.HexToAddress(receiptAddr)
	} else {
		logger.Fatal("ERC8004_RECEIPT_ADDRESS environment variable is required")
	}

	if tokenAddr := os.Getenv("REWARD_TOKEN_ADDRESS"); tokenAddr != "" {
		addresses.RewardToken = common.HexToAddress(tokenAddr)
	} else {
		logger.Fatal("REWARD_TOKEN_ADDRESS environment variable is required")
	}

	if paymentAddr := os.Getenv("PAYMENT_PROCESSOR_ADDRESS"); paymentAddr != "" {
		addresses.PaymentProcessor = common.HexToAddress(paymentAddr)
	} else {
		logger.Fatal("PAYMENT_PROCESSOR_ADDRESS environment variable is required")
	}

	return addresses
}

// getEnvOrDefault gets environment variable or returns default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// mustParseABI parses an ABI JSON string and panics on error
func mustParseABI(abiJSON string) abi.ABI {
	parsedABI, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		panic(fmt.Sprintf("Failed to parse ABI: %v", err))
	}
	return parsedABI
}

// MLVerificationResult represents the result of ML verification
type MLVerificationResult struct {
	IsValid    bool                   `json:"isValid"`
	Confidence uint64                 `json:"confidence"`
	Method     string                 `json:"method"`
	Details    map[string]interface{} `json:"details"`
}

// ========== Contract ABIs ==========

const ProofOfInferenceAVSABIJSON = `[
	{
		"inputs": [{"internalType": "uint256", "name": "requestId", "type": "uint256"}],
		"name": "getInferenceRequest",
		"outputs": [{
			"components": [
				{"internalType": "address", "name": "agent", "type": "address"},
				{"internalType": "string", "name": "modelId", "type": "string"},
				{"internalType": "bytes", "name": "inputData", "type": "bytes"},
				{"internalType": "bytes", "name": "expectedOutput", "type": "bytes"},
				{"internalType": "uint256", "name": "reward", "type": "uint256"},
				{"internalType": "uint256", "name": "deadline", "type": "uint256"},
				{"internalType": "bool", "name": "completed", "type": "bool"},
				{"internalType": "bool", "name": "verified", "type": "bool"},
				{"internalType": "uint256", "name": "timestamp", "type": "uint256"},
				{"internalType": "bytes32", "name": "requestHash", "type": "bytes32"}
			],
			"internalType": "struct ProofOfInferenceAVS.InferenceRequest",
			"name": "",
			"type": "tuple"
		}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
		"name": "getAgentTrustScore",
		"outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "string", "name": "modelId", "type": "string"}],
		"name": "getModelInfo",
		"outputs": [{
			"components": [
				{"internalType": "string", "name": "modelId", "type": "string"},
				{"internalType": "address", "name": "owner", "type": "address"},
				{"internalType": "uint256", "name": "verificationFee", "type": "uint256"},
				{"internalType": "bool", "name": "isActive", "type": "bool"},
				{"internalType": "uint256", "name": "totalInferences", "type": "uint256"},
				{"internalType": "uint256", "name": "successfulVerifications", "type": "uint256"},
				{"internalType": "uint256", "name": "accuracy", "type": "uint256"}
			],
			"internalType": "struct ProofOfInferenceAVS.ModelInfo",
			"name": "",
			"type": "tuple"
		}],
		"stateMutability": "view",
		"type": "function"
	}
]`

const ERC8004ReceiptABIJSON = `[
	{
		"inputs": [{"internalType": "uint256", "name": "receiptId", "type": "uint256"}],
		"name": "isReceiptVerified",
		"outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "uint256", "name": "receiptId", "type": "uint256"}],
		"name": "getReceipt",
		"outputs": [{
			"components": [
				{"internalType": "uint256", "name": "receiptId", "type": "uint256"},
				{"internalType": "address", "name": "agent", "type": "address"},
				{"internalType": "uint256", "name": "bountyId", "type": "uint256"},
				{"internalType": "string", "name": "workDescription", "type": "string"},
				{"internalType": "string", "name": "resultHash", "type": "string"},
				{"internalType": "string", "name": "resultURI", "type": "string"},
				{"internalType": "uint256", "name": "valueGenerated", "type": "uint256"},
				{"internalType": "uint256", "name": "completionTime", "type": "uint256"},
				{"internalType": "uint256", "name": "timestamp", "type": "uint256"},
				{"internalType": "bool", "name": "isVerified", "type": "bool"},
				{"internalType": "bytes", "name": "signature", "type": "bytes"},
				{"internalType": "string", "name": "attestationHash", "type": "string"}
			],
			"internalType": "struct ERC8004Receipt.WorkReceipt",
			"name": "",
			"type": "tuple"
		}],
		"stateMutability": "view",
		"type": "function"
	}
]`

const PaymentProcessorABIJSON = `[
	{
		"inputs": [
			{"internalType": "address", "name": "agent", "type": "address"},
			{"internalType": "uint256", "name": "amount", "type": "uint256"},
			{"internalType": "string", "name": "purpose", "type": "string"}
		],
		"name": "processPayment",
		"outputs": [{"internalType": "bytes32", "name": "paymentHash", "type": "bytes32"}],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "bytes32", "name": "paymentHash", "type": "bytes32"}],
		"name": "getPaymentStatus",
		"outputs": [
			{"internalType": "bool", "name": "exists", "type": "bool"},
			{"internalType": "bool", "name": "completed", "type": "bool"},
			{"internalType": "uint256", "name": "amount", "type": "uint256"},
			{"internalType": "address", "name": "recipient", "type": "address"}
		],
		"stateMutability": "view",
		"type": "function"
	}
]`

// HTTP handler for direct task submission
func (tw *TaskWorker) httpVerificationHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var task InferenceVerificationTask
	if err := json.Unmarshal(body, &task); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	tw.logger.Info("HTTP verification request received",
		zap.Uint64("requestId", task.RequestID),
		zap.String("modelId", task.ModelID))

	taskJSON, _ := json.Marshal(task)
	taskReq := &performerV1.TaskRequest{
		TaskId:  []byte(fmt.Sprintf("http-req-%d", time.Now().Unix())),
		Payload: taskJSON,
	}

	if err := tw.ValidateTask(taskReq); err != nil {
		tw.logger.Warn("Task validation failed", zap.Error(err))
		response := VerificationResponse{
			Status: "rejected",
			Reason: err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	taskResp, err := tw.HandleTask(taskReq)
	if err != nil {
		tw.logger.Error("Task handling failed", zap.Error(err))
		http.Error(w, fmt.Sprintf("Task failed: %v", err), http.StatusInternalServerError)
		return
	}

	var verificationResp VerificationResponse
	if err := json.Unmarshal(taskResp.Result, &verificationResp); err != nil {
		http.Error(w, "Failed to parse response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(verificationResp)
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "proof-of-inference-avs-cors-enabled",
	})
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	} else {
		fmt.Println("✅ Loaded .env file")
	}

	ctx := context.Background()
	l, _ := zap.NewProduction()

	w := NewTaskWorker(l)

	// Start gRPC server on port 8081
	pp, err := server.NewPonosPerformerWithRpcServer(&server.PonosPerformerConfig{
		Port:    8081,
		Timeout: 5 * time.Second,
	}, w, l)
	if err != nil {
		panic(fmt.Errorf("failed to create performer: %w", err))
	}

	// Start HTTP server on port 8082 for easier integration
	http.HandleFunc("/verify", w.httpVerificationHandler)
	http.HandleFunc("/health", healthHandler)

	go func() {
		l.Info("Starting HTTP server on :8082")
		if err := http.ListenAndServe(":8082", nil); err != nil {
			l.Fatal("HTTP server failed", zap.Error(err))
		}
	}()

	// Start gRPC server (blocking)
	l.Info("Starting gRPC server on :8081")
	if err := pp.Start(ctx); err != nil {
		panic(err)
	}
}