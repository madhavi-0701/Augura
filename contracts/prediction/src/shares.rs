#![no_std]

use soroban_sdk::{Address, Env};

use crate::errors::Error;

#[derive(Clone, Debug)]
pub struct ShareBalance {
    pub market_id: u64,
    pub holder: Address,
    pub yes_shares: u64,
    pub no_shares: u64,
    pub claimed: bool,
}

impl ShareBalance {
    pub fn new(market_id: u64, holder: Address) -> Self {
        Self {
            market_id,
            holder,
            yes_shares: 0,
            no_shares: 0,
            claimed: false,
        }
    }

    pub fn add_yes_shares(&mut self, amount: u64) {
        self.yes_shares = self.yes_shares.saturating_add(amount);
    }

    pub fn add_no_shares(&mut self, amount: u64) {
        self.no_shares = self.no_shares.saturating_add(amount);
    }

    pub fn total_shares(&self) -> u64 {
        self.yes_shares.saturating_add(self.no_shares)
    }
}

pub fn save_share_balance(e: &Env, balance: &ShareBalance) {
    let key = format!("share_{}_{}", balance.market_id, balance.holder);
    e.storage().instance().set(&key, balance);
}

pub fn load_share_balance(e: &Env, market_id: u64, holder: &Address) -> Result<ShareBalance, Error> {
    let key = format!("share_{}_{}", market_id, holder);
    e.storage()
        .instance()
        .get(&key)
        .ok_or(Error::MarketNotFound)
}

pub fn get_or_create_share_balance(e: &Env, market_id: u64, holder: &Address) -> ShareBalance {
    let key = format!("share_{}_{}", market_id, holder);
    e.storage()
        .instance()
        .get::<_, ShareBalance>(key)
        .unwrap_or_else(|| ShareBalance::new(market_id, holder.clone()))
}