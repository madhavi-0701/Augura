#![no_std]

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    MarketNotFound = 1,
    MarketNotOpen = 2,
    MarketNotClosed = 3,
    MarketAlreadyResolved = 4,
    MarketNotResolved = 5,
    Unauthorized = 6,
    DeadlinePassed = 7,
    DeadlineNotPassed = 8,
    AlreadyClaimed = 9,
    NothingToClaim = 10,
    InsufficientPayment = 11,
    InvalidShareQuantity = 12,
    InvalidDeadline = 13,
    InvalidSharePrice = 14,
    MarketNotVoidable = 15,
    AlreadyInitialized = 16,
    NotInitialized = 17,
}