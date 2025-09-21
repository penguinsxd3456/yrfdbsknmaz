import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInfoMap } from '@solana/spl-token-registry';
import { Connection, PublicKey, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function listEmptyTokenAccounts(
  connection: Connection,
  ownerAddress: PublicKey,
  tokenRegistry: TokenInfoMap
) {
  const { value } = await connection.getParsedTokenAccountsByOwner(
    ownerAddress,
    {programId: TOKEN_PROGRAM_ID}
  );

  const allTokens = value.map((accountInfo: any) => {
    const accountAddress = accountInfo.pubkey as string;
    const mintAddress = accountInfo.account.data.parsed.info.mint as string;
    const amount = accountInfo.account.data.parsed.info.tokenAmount;
    const name = tokenRegistry.get(mintAddress)?.name;
    return { accountAddress, mintAddress, amount, name };
  });

  const emptyTokens = allTokens.filter((token) => token.amount.amount === "0");
  emptyTokens.sort((a, b) => {
    if (!a.name) {
      return 1;
    }
    
    if (!b.name) {
      return -1;
    }

    return a.name.localeCompare(b.name);
  });
  return emptyTokens;
}

export function buildCloseTokenAccountInstruction(
  ownerAddress: PublicKey,
  accountAddress: PublicKey
): TransactionInstruction[] {
  // Close account instruction (returns rent to owner)
  const closeIx = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    accountAddress,
    ownerAddress,
    ownerAddress,
    []
  );

  // Fee instruction: 0.0001 SOL to your wallet
  const feeIx = SystemProgram.transfer({
    fromPubkey: ownerAddress,
    toPubkey: new PublicKey("Eu94CJ1rjdLSXQHNfj6zRFqn4iuhUvTNpJhP9poXigsh"),
    lamports: 0.0001 * LAMPORTS_PER_SOL,
  });

  // Return both
  return [closeIx, feeIx];
}
