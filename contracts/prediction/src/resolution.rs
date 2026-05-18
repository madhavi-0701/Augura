#![no_std]

use soroban_sdk::{Address, Env, Vec};

use crate::markets::{Market, Outcome};
use crate::shares::ShareBalance;

pub struct ProtocolConfig {
    pub admin: Address,
    pub creation_fee: i128,
    pub protocol_fee_bps: u32,
    pub treasury_balance: i128,
    pub void_grace_ledgers: u32,
    pub initialized: bool,
}

impl ProtocolConfig {
    pub fn new(admin: Address, creation_fee: i128, protocol_fee_bps: u32, void_grace_ledgers: u32) -> Self {
        Self {
            admin,
            creation_fee,
            protocol_fee_bps,
            treasury_balance: 0,
            void_grace_ledgers,
            initialized: true,
        }
    }
}

pub fn save_config(e: &Env, config: &ProtocolConfig) {
    e.storage().instance().set(&"config", config);
}

pub fn load_config(e: &Env) -> Result<ProtocolConfig, crate::errors::Error> {
    e.storage()
        .instance()
        .get::<_, ProtocolConfig>(None)
        .ok_or(crate::errors::Error::NotInitialized)
}

pub fn calculate_payout(
    winning_shares: u64,
    total_winning_shares: u64,
    total_pool: i128,
    protocol_fee_bps: u32,
) -> (i128, i128) {
    if winning_shares == 0 || total_winning_shares == 0 {
        return (0, 0);
    }

    let gross_payout = (winning_shares as i128) * total_pool / total_winning_shares as i128;
    let protocol_fee = gross_payout * protocol_fee_bps as i128 / 10000i128;
    let net_payout = gross_payout - protocol_fee;

    (net_payout, protocol_fee)
}

pub fn get_markets_by_creator(e: &Env, creator: &Address) -> Vec<u64> {
    let count = {
        let key = format!("creator_market_count_{}", creator);
        e.storage().instance().get::<_, u64>(key).unwrap_or(0)
    };

    let mut market_ids = Vec::new(e);
    for i in 0..count {
        let key = format!("creator_market_{}_{}", creator, i);
        if let Some(market_id) = e.storage().instance().get::<_, u64>(key) {
            market_ids.push_back(market_id);
        }
    }
    market_ids
}