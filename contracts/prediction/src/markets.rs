#![no_std]

use soroban_sdk::{Address, Env};

use crate::errors::Error;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum MarketStatus {
    Open,
    Closed,
    Resolved,
    Voided,
}

impl MarketStatus {
    pub fn to_u32(&self) -> u32 {
        match self {
            MarketStatus::Open => 0,
            MarketStatus::Closed => 1,
            MarketStatus::Resolved => 2,
            MarketStatus::Voided => 3,
        }
    }

    pub fn from_u32(v: u32) -> MarketStatus {
        match v {
            0 => MarketStatus::Open,
            1 => MarketStatus::Closed,
            2 => MarketStatus::Resolved,
            3 => MarketStatus::Voided,
            _ => MarketStatus::Open,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum Outcome {
    Yes,
    No,
}

impl Outcome {
    pub fn to_u32(&self) -> u32 {
        match self {
            Outcome::Yes => 0,
            Outcome::No => 1,
        }
    }

    pub fn from_u32(v: u32) -> Outcome {
        match v {
            0 => Outcome::Yes,
            1 => Outcome::No,
            _ => Outcome::Yes,
        }
    }
}

#[derive(Clone, Debug)]
pub struct Market {
    pub id: u64,
    pub creator: Address,
    pub question: String,
    pub oracle: Address,
    pub share_price: i128,
    pub deadline_ledger: u64,
    pub resolution_ledger: u64,
    pub status: MarketStatus,
    pub outcome: Option<Outcome>,
    pub yes_shares_sold: u64,
    pub no_shares_sold: u64,
    pub total_pool: i128,
    pub created_at: u64,
}

impl Market {
    pub fn is_open(&self) -> bool {
        self.status == MarketStatus::Open
    }

    pub fn is_closed(&self) -> bool {
        self.status == MarketStatus::Closed
    }

    pub fn is_resolved(&self) -> bool {
        self.status == MarketStatus::Resolved
    }

    pub fn is_voided(&self) -> bool {
        self.status == MarketStatus::Voided
    }
}

pub fn save_market(e: &Env, market: &Market) {
    let key = format!("market_{}", market.id);
    e.storage().instance().set(&key, market);
}

pub fn load_market(e: &Env, market_id: u64) -> Result<Market, Error> {
    let key = format!("market_{}", market_id);
    e.storage()
        .instance()
        .get(&key)
        .ok_or(Error::MarketNotFound)
}

pub fn get_market_count(e: &Env) -> u64 {
    let key = "market_count";
    e.storage().instance().get::<_, u64>(key).unwrap_or(0)
}

pub fn set_market_count(e: &Env, count: u64) {
    let key = "market_count";
    e.storage().instance().set(&key, &count);
}

pub fn save_creator_market_index(e: &Env, creator: &Address, index: u64, market_id: u64) {
    let key = format!("creator_market_{}_{}", creator, index);
    e.storage().instance().set(&key, &market_id);
}

pub fn get_creator_market_count(e: &Env, creator: &Address) -> u64 {
    let key = format!("creator_market_count_{}", creator);
    e.storage()
        .instance()
        .get::<_, u64>(key)
        .unwrap_or(0)
}

pub fn set_creator_market_count(e: &Env, creator: &Address, count: u64) {
    let key = format!("creator_market_count_{}", creator);
    e.storage().instance().set(&key, &count);
}