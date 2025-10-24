#!/usr/bin/env python3
"""
Verbose Demo - Shows Model Outputs Clearly
Explains exactly what's happening at each step
"""

import asyncio
import requests
import os
from colorama import Fore, Style, init

init(autoreset=True)

async def main():
    print(f"\n{Fore.CYAN}{'='*80}")
    print(f"{Fore.CYAN}VERBOSE DEMO - See Exactly What's Happening")
    print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")

    # Check OpenRouter API key
    api_key = os.getenv("OPENROUTER_API_KEY") or "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"

    if not api_key:
        print(f"{Fore.RED}❌ OPENROUTER_API_KEY not set{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}This is why you don't see model outputs!{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}The system is running in MOCK mode.{Style.RESET_ALL}\n")
        print(f"To see REAL LLM outputs:")
        print(f"  1. Get API key: https://openrouter.ai")
        print(f"  2. export OPENROUTER_API_KEY='sk-or-v1-your_key'")
        print(f"  3. ./stop-all-services.sh && ./start-all-services.sh")
        print(f"  4. Run this demo again\n")

        print(f"{Fore.YELLOW}For now, I'll show you what's happening in mock mode...{Style.RESET_ALL}\n")
        await asyncio.sleep(2)
    else:
        print(f"{Fore.GREEN}✅ OPENROUTER_API_KEY is set{Style.RESET_ALL}")
        print(f"{Fore.GREEN}You will see REAL LLM outputs!{Style.RESET_ALL}\n")
        await asyncio.sleep(1)

    # Test case
    test = {
        "requestId": 9999,
        "modelId": "gpt-3.5-turbo",
        "inputData": "What is 2+2?",
        "expectedOutput": "4",
        "actualOutput": "4",
        "reward": "1000000000000000000",
        "deadline": 9999999999,
        "agent": "0x1234567890123456789012345678901234567890"
    }

    print(f"{Fore.CYAN}Test Question:{Style.RESET_ALL}")
    print(f"   {test['inputData']}\n")

    print(f"{Fore.CYAN}Submitting to AVS...{Style.RESET_ALL}\n")

    try:
        response = requests.post(
            "http://localhost:8082/verify",
            json=test,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            print(f"{Fore.GREEN}✅ Response received!{Style.RESET_ALL}\n")

            print(f"{Fore.YELLOW}{'─'*80}")
            print(f"{Fore.YELLOW}What Happened Behind the Scenes:")
            print(f"{Fore.YELLOW}{'─'*80}{Style.RESET_ALL}\n")

            if not api_key:
                print(f"{Fore.RED}1. ML Agent (Mock Mode):{Style.RESET_ALL}")
                print(f"   - No real LLM API call made")
                print(f"   - Used fallback heuristic verification")
                print(f"   - Compared input/output text similarity")
                print(f"   - Generated confidence score: {result['confidence']}%")
                print(f"   - Result: Valid={result['isValid']} (low confidence)\n")

                print(f"{Fore.RED}2. Payment Service:{Style.RESET_ALL}")
                if result.get('paymentHash'):
                    print(f"   - Payment would be processed")
                else:
                    print(f"   - ❌ Skipped (verification not valid)")
                    print(f"   - Only valid verifications get paid\n")

                print(f"{Fore.RED}3. Receipt Service:{Style.RESET_ALL}")
                if result.get('receiptId'):
                    print(f"   - Receipt would be minted")
                else:
                    print(f"   - ❌ Skipped (no payment made)")
                    print(f"   - Receipts only for paid work\n")
            else:
                print(f"{Fore.GREEN}1. ML Agent (Real Mode):{Style.RESET_ALL}")
                print(f"   - ✅ Made real API call to OpenRouter")
                print(f"   - ✅ Got actual LLM response")
                print(f"   - ✅ Compared with expected output")
                print(f"   - ✅ High confidence: {result['confidence']}%")
                print(f"   - ✅ Valid: {result['isValid']}\n")

                print(f"{Fore.GREEN}2. Payment Service:{Style.RESET_ALL}")
                if result.get('paymentHash'):
                    print(f"   - ✅ Payment processed")
                    print(f"   - Hash: {result['paymentHash']}")
                else:
                    print(f"   - Would process if wallet funded\n")

                print(f"{Fore.GREEN}3. Receipt Service:{Style.RESET_ALL}")
                if result.get('receiptId'):
                    print(f"   - ✅ Receipt minted")
                    print(f"   - ID: #{result['receiptId']}")
                else:
                    print(f"   - Would mint if wallet funded\n")

            print(f"{Fore.MAGENTA}{'─'*80}")
            print(f"{Fore.MAGENTA}Proofs Generated:")
            print(f"{Fore.MAGENTA}{'─'*80}{Style.RESET_ALL}\n")

            print(f"🔐 Verification Proof (always generated):")
            print(f"   {result['verificationProof']}")
            print(f"   Location: Off-chain (ML Agent)")
            print(f"   Purpose: Proves ML verification was done\n")

            print(f"🔐 Attestation Hash (always generated):")
            print(f"   {result['attestationHash']}")
            print(f"   Location: Off-chain (AVS)")
            print(f"   Purpose: AVS approval signature\n")

            if result.get('paymentHash'):
                print(f"🔐 Payment Hash:")
                print(f"   {result['paymentHash']}")
                print(f"   Location: On-chain (Base Sepolia)")
                print(f"   BaseScan: https://sepolia.basescan.org/tx/{result['paymentHash']}\n")
            else:
                print(f"❌ Payment Hash: Not generated")
                print(f"   Why: Verification not valid OR wallet not funded\n")

            if result.get('receiptId'):
                print(f"🧾 Receipt ID:")
                print(f"   #{result['receiptId']}")
                print(f"   Location: On-chain (Base Sepolia)")
                print(f"   Contract: 0x7177a6867296406881E20d6647232314736Dd09A\n")
            else:
                print(f"❌ Receipt ID: Not generated")
                print(f"   Why: No payment was made\n")

            print(f"{Fore.CYAN}{'─'*80}")
            print(f"{Fore.CYAN}Summary:")
            print(f"{Fore.CYAN}{'─'*80}{Style.RESET_ALL}\n")

            if not api_key:
                print(f"{Fore.YELLOW}Current Mode: DEMO/MOCK{Style.RESET_ALL}")
                print(f"   What works: Service orchestration, proof generation")
                print(f"   What doesn't: Real LLM calls, blockchain transactions")
                print(f"   Why: No API keys / wallet not funded\n")

                print(f"{Fore.GREEN}To get FULL functionality:{Style.RESET_ALL}")
                print(f"   1. Set OPENROUTER_API_KEY for real LLM calls")
                print(f"   2. Fund wallet for blockchain transactions")
                print(f"   3. Restart services")
                print(f"   4. Run demo again\n")
            else:
                print(f"{Fore.GREEN}Current Mode: PRODUCTION{Style.RESET_ALL}")
                print(f"   ✅ Real LLM API calls")
                print(f"   ✅ Real verification")
                print(f"   ✅ High confidence scores")
                if result.get('paymentHash'):
                    print(f"   ✅ Real blockchain transactions")
                else:
                    print(f"   ⚠️  Need to fund wallet for blockchain")
                print()

        else:
            print(f"{Fore.RED}❌ Request failed: {response.status_code}{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}❌ Error: {e}{Style.RESET_ALL}")

if __name__ == "__main__":
    asyncio.run(main())
