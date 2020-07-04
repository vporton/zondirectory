
// This contract is a token contract that supports divisibility. 
// As long as the max supply of the token is <= Number.MAX_SAFE_INTEGER 
// This will work fine, (all operations are done as integer values) 

export function handle(state, action) {
  
  let balances = state.balances;
  let input = action.input;
  let caller = action.caller;

  if (input.function == 'transfer') {

    let target = input.target;
    
    if (isNaN(input.qty)) {
      throw new ContractError(`Invalid quantity`);
    }

    let qty = Math.trunc(parseFloat(input.qty) * state.divisibility);

    if (!target) {
      throw new ContractError(`No target specified`);
    }

    if (qty <= 0 || caller == target) {
      throw new ContractError('Invalid token transfer');
    }

    if (balances[caller] < qty) {
      throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
    }

    // Lower the token balance of the caller
    balances[caller] -= qty;
    if (target in balances) {
      // Wallet already exists in state, add new tokens
      balances[target] += qty;
    } else {
      // Wallet is new, set starting balance
      balances[target] = qty;
    }

    return { state };
  }

  if (input.function == 'balance') {

    let target = input.target;
    let ticker = state.ticker;
    let divisibility = state.divisibility;
    let balance = balances[target] / divisibility;
    
    if (typeof target !== 'string') {
      throw new ContractError(`Must specificy target to get balance for`);
    }
    if (typeof balances[target] !== 'number') {
      throw new ContractError(`Cannnot get balance, target does not exist`);
    }

    return { result: { target, ticker, balance: balance.toFixed(divisibility), divisibility } };
  }

  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}