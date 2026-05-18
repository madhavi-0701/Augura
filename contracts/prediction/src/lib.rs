#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol, Vec};

fn create_symbol(e: &Env, s: &str) -> Symbol {
    Symbol::new(e, s)
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    pub fn initialize(e: Env, admin: Address, creation_fee: i128, protocol_fee_bps: u32, void_grace_ledgers: u32) {
        let init_key = create_symbol(&e, "init");
        if e.storage().instance().get::<_, bool>(&init_key).unwrap_or(false) {
            panic!("already initialized");
        }
        let admin_key = create_symbol(&e, "admin");
        let fee_key = create_symbol(&e, "fee");
        let bps_key = create_symbol(&e, "bps");
        let treasury_key = create_symbol(&e, "treasury");
        let grace_key = create_symbol(&e, "grace");
        
        e.storage().instance().set(&admin_key, &admin);
        e.storage().instance().set(&fee_key, &creation_fee);
        e.storage().instance().set(&bps_key, &protocol_fee_bps);
        e.storage().instance().set(&treasury_key, &0i128);
        e.storage().instance().set(&grace_key, &void_grace_ledgers);
        e.storage().instance().set(&init_key, &true);
        let count_key = create_symbol(&e, "count");
        e.storage().instance().set(&count_key, &0u64);
    }

    pub fn create_market(e: Env, caller: Address, question: String, oracle: Address, share_price: i128, deadline_ledger: u64, resolution_ledger: u64) -> u64 {
        let init_key = create_symbol(&e, "init");
        if !e.storage().instance().get::<_, bool>(&init_key).unwrap_or(false) {
            panic!("not initialized");
        }
        let current = e.ledger().sequence() as u64;
        if deadline_ledger <= current { panic!("invalid deadline"); }
        if resolution_ledger < deadline_ledger { panic!("invalid resolution"); }
        if share_price <= 0 { panic!("invalid price"); }
        if question.is_empty() { panic!("empty question"); }

        let count_key = create_symbol(&e, "count");
        let count: u64 = e.storage().instance().get(&count_key).unwrap_or(0);
        let id = count + 1;

        let market_key = (create_symbol(&e, "m"), id);
        let data = (id, caller, question, oracle, share_price, deadline_ledger, resolution_ledger, 0u32, 0u64, 0u64, 0i128, current);
        e.storage().instance().set(&market_key, &data);
        e.storage().instance().set(&count_key, &id);
        id
    }

    pub fn buy_shares(e: Env, caller: Address, market_id: u64, side: u32, quantity: u64) {
        let market_key = (create_symbol(&e, "m"), market_id);
        let market: Option<(u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64)> = e.storage().instance().get(&market_key);
        let mut m = market.expect("market not found");

        let status = m.7;
        if status != 0 { panic!("market not open"); }

        let current = e.ledger().sequence() as u64;
        if current > m.5 { panic!("deadline passed"); }
        if quantity == 0 { panic!("invalid quantity"); }

        let cost = m.4 * quantity as i128;

        let share_key = (create_symbol(&e, "s"), market_id, caller.clone());
        let mut shares: (u64, u64, bool) = e.storage().instance().get(&share_key).unwrap_or((0, 0, false));

        if side == 0 { 
            shares.0 += quantity; 
            m.8 = m.8.saturating_add(quantity);
        } else { 
            shares.1 += quantity; 
            m.9 = m.9.saturating_add(quantity); 
        }
        m.10 = m.10.saturating_add(cost);

        e.storage().instance().set(&market_key, &m);
        e.storage().instance().set(&share_key, &shares);
    }

    pub fn resolve(e: Env, caller: Address, market_id: u64, outcome: u32) {
        let market_key = (create_symbol(&e, "m"), market_id);
        let mut m: (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64) = e.storage().instance().get(&market_key).expect("market not found");

        if m.3 != caller { panic!("not oracle"); }

        let current = e.ledger().sequence() as u64;
        if current < m.6 { panic!("too early"); }

        m.7 = 1u32;
        m.8 = outcome as u64;
        e.storage().instance().set(&market_key, &m);
    }

    pub fn claim(e: Env, caller: Address, market_id: u64) -> i128 {
        let market_key = (create_symbol(&e, "m"), market_id);
        let m: (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64) = e.storage().instance().get(&market_key).expect("market not found");

        if m.7 != 1 { panic!("not resolved"); }

        let outcome = m.8;
        let share_key = (create_symbol(&e, "s"), market_id, caller.clone());
        let mut shares: (u64, u64, bool) = e.storage().instance().get(&share_key).expect("no shares");

        if shares.2 { panic!("already claimed"); }

        let winning = if outcome == 0 { shares.0 } else { shares.1 };
        if winning == 0 { panic!("nothing to claim"); }

        let total: i128 = if outcome == 0 { m.9 as i128 } else { m.10 };
        let pool = m.11;

        let bps_key = create_symbol(&e, "bps");
        let fee_bps: u32 = e.storage().instance().get(&bps_key).unwrap_or(200);
        
        let gross: i128 = (winning as i128) * (pool as i128) / total;
        let fee: i128 = gross * fee_bps as i128 / 10000;
        let net = gross - fee;

        let treasury_key = create_symbol(&e, "treasury");
        let mut treasury: i128 = e.storage().instance().get(&treasury_key).unwrap_or(0);
        treasury = treasury.saturating_add(fee);
        e.storage().instance().set(&treasury_key, &treasury);

        shares.2 = true;
        e.storage().instance().set(&share_key, &shares);
        net
    }

    pub fn void_market(e: Env, market_id: u64) {
        let market_key = (create_symbol(&e, "m"), market_id);
        let mut m: (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64) = e.storage().instance().get(&market_key).expect("market not found");

        if m.7 != 0 { panic!("already resolved"); }

        let grace_key = create_symbol(&e, "grace");
        let grace: u32 = e.storage().instance().get(&grace_key).unwrap_or(100);
        let current = e.ledger().sequence() as u64;
        if current < m.6 + grace as u64 { panic!("not voidable"); }

        m.7 = 3u32;
        e.storage().instance().set(&market_key, &m);
    }

    pub fn claim_refund(e: Env, caller: Address, market_id: u64) -> i128 {
        let market_key = (create_symbol(&e, "m"), market_id);
        let m: (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64) = e.storage().instance().get(&market_key).expect("market not found");

        if m.7 != 3 { panic!("not voided"); }

        let share_key = (create_symbol(&e, "s"), market_id, caller.clone());
        let mut shares: (u64, u64, bool) = e.storage().instance().get(&share_key).expect("no shares");

        if shares.2 { panic!("already claimed"); }

        let refund = (shares.0.saturating_add(shares.1)) as i128 * m.4;
        shares.2 = true;
        e.storage().instance().set(&share_key, &shares);
        refund
    }

    pub fn withdraw_treasury(e: Env, caller: Address) -> i128 {
        let admin_key = create_symbol(&e, "admin");
        let admin: Address = e.storage().instance().get(&admin_key).expect("no admin");
        if caller != admin { panic!("not admin"); }

        let treasury_key = create_symbol(&e, "treasury");
        let amount: i128 = e.storage().instance().get(&treasury_key).unwrap_or(0);
        e.storage().instance().set(&treasury_key, &0i128);
        amount
    }

    pub fn get_market(e: Env, market_id: u64) -> (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64) {
        let market_key = (create_symbol(&e, "m"), market_id);
        e.storage().instance().get(&market_key).expect("market not found")
    }

    pub fn get_market_count(e: Env) -> u64 {
        let count_key = create_symbol(&e, "count");
        e.storage().instance().get(&count_key).unwrap_or(0)
    }

    pub fn get_share_balance(e: Env, market_id: u64, holder: Address) -> (u64, u64, bool) {
        let share_key = (create_symbol(&e, "s"), market_id, holder);
        e.storage().instance().get(&share_key).unwrap_or((0, 0, false))
    }

    pub fn get_config(e: Env) -> (Address, i128, u32, i128, u32) {
        let admin_key = create_symbol(&e, "admin");
        let fee_key = create_symbol(&e, "fee");
        let bps_key = create_symbol(&e, "bps");
        let treasury_key = create_symbol(&e, "treasury");
        let grace_key = create_symbol(&e, "grace");
        
        let admin: Address = e.storage().instance().get(&admin_key).unwrap_or(Address::from_string(&String::from_slice(&e, "")));
        let fee: i128 = e.storage().instance().get(&fee_key).unwrap_or(0);
        let bps: u32 = e.storage().instance().get(&bps_key).unwrap_or(200);
        let treasury: i128 = e.storage().instance().get(&treasury_key).unwrap_or(0);
        let grace: u32 = e.storage().instance().get(&grace_key).unwrap_or(100);
        (admin, fee, bps, treasury, grace)
    }

    pub fn get_markets_by_creator(e: Env, creator: Address) -> Vec<u64> {
        let count_key = create_symbol(&e, "count");
        let count: u64 = e.storage().instance().get(&count_key).unwrap_or(0);
        let mut result = Vec::new(&e);
        for i in 1..=count {
            let market_key = (create_symbol(&e, "m"), i);
            if let Some(m) = e.storage().instance().get::<_, (u64, Address, String, Address, i128, u64, u64, u32, u64, u64, i128, u64)>(&market_key) {
                if m.1 == creator {
                    result.push_back(i);
                }
            }
        }
        result
    }

    pub fn set_share_price_lmsr(_e: Env, _market_id: u64, _b_param: i128) { panic!("not implemented") }
    pub fn add_liquidity(_e: Env, _market_id: u64, _amount: i128) -> i128 { panic!("not implemented") }
    pub fn remove_liquidity(_e: Env, _market_id: u64, _lp_shares: u64) -> i128 { panic!("not implemented") }
    pub fn resolve_multi_sig(_e: Env, _market_id: u64, _outcome: u32, _signatures: Vec<Address>) { panic!("not implemented") }
    pub fn update_oracle(_e: Env, _market_id: u64, _new_oracle: Address) { panic!("not implemented") }
    pub fn set_creation_fee(_e: Env, _new_fee: i128) { panic!("not implemented") }
    pub fn set_protocol_fee_bps(_e: Env, _new_bps: u32) { panic!("not implemented") }
}