#![cfg_attr(not(feature = "std"), no_std)]

#[ink::contract]
mod dns {
    use ink::storage::Mapping;

    /// Emitted whenever a new name is being registered.
    #[ink(event)]
    pub struct Register {
        #[ink(topic)]
        name: Hash,
        #[ink(topic)]
        from: AccountId,
    }

    /// Emitted whenever an address changes.
    #[ink(event)]
    pub struct SetAddress {
        #[ink(topic)]
        name: Hash,
        from: AccountId,
        #[ink(topic)]
        old_address: Option<AccountId>,
        #[ink(topic)]
        new_address: AccountId,
    }

    /// Emitted whenever a name is being transferred.
    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        name: Hash,
        from: AccountId,
        #[ink(topic)]
        old_owner: Option<AccountId>,
        #[ink(topic)]
        new_owner: AccountId,
    }

    /// Domain name service contract inspired by
    /// [this blog post](https://medium.com/@chainx_org/secure-and-decentralized-polkadot-domain-name-system-e06c35c2a48d).
    ///
    /// # Note
    ///
    /// This is a port from the blog post's ink! 1.0 based version of the contract
    /// to ink! 2.0.
    ///
    /// # Description
    ///
    /// The main function of this contract is domain name resolution which
    /// refers to the retrieval of numeric values corresponding to readable
    /// and easily memorable names such as "polka.dot" which can be used
    /// to facilitate transfers, voting and DApp-related operations instead
    /// of resorting to long IP addresses that are hard to remember.
    #[ink(storage)]
    pub struct DomainNameService {
        /// A hashmap to store all name to addresses mapping.
        name_to_address: Mapping<Hash, AccountId>,
        /// A hashmap to store all name to owners mapping.
        name_to_owner: Mapping<Hash, AccountId>,
        /// The default address.
        default_address: AccountId,
    }

    impl Default for DomainNameService {
        fn default() -> Self {
            let mut name_to_address = Mapping::new();
            name_to_address.insert(Hash::default(), &zero_address());
            let mut name_to_owner = Mapping::new();
            name_to_owner.insert(Hash::default(), &zero_address());

            Self {
                name_to_address,
                name_to_owner,
                default_address: zero_address(),
            }
        }
    }

    impl core::fmt::Display for Error {
        fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
            match self {
                Error::NameAlreadyExists => write!(f, "The provided name has a hash that is already registered. Please choose a different name."),
                Error::CallerIsNotOwner => write!(f, "Caller is not the owner."),
            }
        }
    }

    /// Errors that can occur upon calling this contract.
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Returned if the name already exists upon registration.
        NameAlreadyExists,
        /// Returned if caller is not owner while required to.
        CallerIsNotOwner,
    }

    /// Type alias for the contract's result type.
    pub type Result<T> = core::result::Result<T, Error>;

    impl DomainNameService {
        /// Creates a new domain name service contract.
        #[ink(constructor)]
        pub fn new() -> Self {
            Default::default()
        }

        /// Register a specific name with the caller as the owner.
        ///
        /// This method allows users to register unique names that can be later associated with
        /// other information, such as addresses or other data. A name can only be registered once,
        /// and the caller becomes the owner of the name.
        ///
        /// # Params
        ///
        /// - `name`: A `Hash` representing the name to be registered.
        ///
        /// # Errors
        ///
        /// If the name already exists, returns an error.
        #[ink(message)]
        pub fn register(&mut self, name: Hash) -> Result<()> {
            let caller = self.env().caller();
            if self.name_to_owner.contains(name) {
                return Err(Error::NameAlreadyExists);
            }

            self.name_to_owner.insert(name, &caller);
            self.env().emit_event(Register { name, from: caller });

            Ok(())
        }

        /// Set address for specific name.
        /// If the caller is not the owner of the name, returns an error.
        #[ink(message)]
        pub fn set_address(&mut self, name: Hash, new_address: AccountId) -> Result<()> {
            let caller = self.env().caller();
            let owner = self.get_owner_or_default(name);
            if caller != owner {
                return Err(Error::CallerIsNotOwner);
            }

            let old_address = self.name_to_address.get(name);
            self.name_to_address.insert(name, &new_address);

            self.env().emit_event(SetAddress {
                name,
                from: caller,
                old_address,
                new_address,
            });
            Ok(())
        }

        /// Transfer owner to another address.
        /// If the caller is not the owner of the name, returns an error.
        #[ink(message)]
        pub fn transfer(&mut self, name: Hash, to: AccountId) -> Result<()> {
            let caller = self.env().caller();
            let owner = self.get_owner_or_default(name);
            if caller != owner {
                return Err(Error::CallerIsNotOwner);
            }

            let old_owner = self.name_to_owner.get(name);
            self.name_to_owner.insert(name, &to);

            self.env().emit_event(Transfer {
                name,
                from: caller,
                old_owner,
                new_owner: to,
            });

            Ok(())
        }

        /// Get address for specific name.
        /// Returns the address associated with the given name or the default address.
        #[ink(message)]
        pub fn get_address(&self, name: Hash) -> AccountId {
            self.get_address_or_default(name)
        }

        /// Get owner of specific name.
        /// Returns the owner of the given name or the default address.
        #[ink(message)]
        pub fn get_owner(&self, name: Hash) -> AccountId {
            self.get_owner_or_default(name)
        }

        /// Returns the owner given the hash or the default address.
        fn get_owner_or_default(&self, name: Hash) -> AccountId {
            self.name_to_owner.get(name).unwrap_or(self.default_address)
        }

        /// Returns the address given the hash or the default address.
        fn get_address_or_default(&self, name: Hash) -> AccountId {
            self.name_to_address
                .get(name)
                .unwrap_or(self.default_address)
        }
    }

    /// Helper for referencing the zero address (`0x00`). Note that in practice this address should
    /// not be treated in any special way (such as a default placeholder) since it has a known
    /// private key.
    fn zero_address() -> AccountId {
        [0u8; 32].into()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn default_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<Environment>()
        }

        fn set_next_caller(caller: AccountId) {
            ink::env::test::set_caller::<Environment>(caller);
        }

        #[ink::test]
        fn register_works() {
            let default_accounts = default_accounts();
            let name = Hash::from([0x99; 32]);

            set_next_caller(default_accounts.alice);
            let mut contract = DomainNameService::new();

            assert_eq!(contract.register(name), Ok(()));
            assert_eq!(contract.register(name), Err(Error::NameAlreadyExists));
        }

        #[ink::test]
        fn set_address_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);

            set_next_caller(accounts.alice);

            let mut contract = DomainNameService::new();
            assert_eq!(contract.register(name), Ok(()));

            // Caller is not owner, `set_address` should fail.
            set_next_caller(accounts.bob);
            assert_eq!(
                contract.set_address(name, accounts.bob),
                Err(Error::CallerIsNotOwner)
            );

            // Caller is owner, set_address will be successful
            set_next_caller(accounts.alice);
            assert_eq!(contract.set_address(name, accounts.bob), Ok(()));
            assert_eq!(contract.get_address(name), accounts.bob);
        }

        #[ink::test]
        fn transfer_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);

            set_next_caller(accounts.alice);

            let mut contract = DomainNameService::new();
            assert_eq!(contract.register(name), Ok(()));

            // Test transfer of owner.
            assert_eq!(contract.transfer(name, accounts.bob), Ok(()));

            // Owner is bob, alice `set_address` should fail.
            assert_eq!(
                contract.set_address(name, accounts.bob),
                Err(Error::CallerIsNotOwner)
            );

            set_next_caller(accounts.bob);
            // Now owner is bob, `set_address` should be successful.
            assert_eq!(contract.set_address(name, accounts.bob), Ok(()));
            assert_eq!(contract.get_address(name), accounts.bob);
        }
    }
}
