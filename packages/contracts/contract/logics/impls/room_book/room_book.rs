pub use crate::{
    ensure,
    impls::room_book::types::{
        AgreementId, Data, HotelError, Rent, RentId, Room, RoomAgreement, RoomId,
    },
    traits::room_book::*,
};
use ink::prelude::{string::String, vec::Vec};
use openbrush::{
    contracts::ownable::*,
    modifier_definition, modifiers,
    traits::{AccountId, Storage, Timestamp, ZERO_ADDRESS},
};

use super::types::RoomResult;

// Events for Hotel room booking
pub trait HotelRoomBookingEvents {
    fn emit_add_room_event(&self, room_id: RoomId, owner: AccountId);
    fn emit_sign_agreement_event(&self, room_id: RoomId, agreement_signer: AccountId);
    fn emit_rent_payment_event(&self, room_id: RoomId, rent_payment_signer: AccountId);
    fn emit_agreement_complete_event(&self, room_id: RoomId);
    fn emit_agreement_terminated_event(&self, room_id: RoomId);
}

impl<T> RoomBook for T
where
    T: Storage<Data> + Storage<ownable::Data>,
{
    #[modifiers(only_owner)]
    default fn add_room(
        &mut self,
        room_name: String,
        room_address: String,
        rent_per_month: u128,
        security_deposit: u128,
        time_stamp: Timestamp,
    ) -> RoomResult {
        // caller of the contract
        let caller = T::env().caller();

        // check validation for `room_name` length, `room_address` length,
        // `rent_per_month` and `security_deposit`
        ensure!(room_name.len() > 4, HotelError::InvalidRoomLength);
        ensure!(room_address.len() > 4, HotelError::InvalidAddressLength);
        ensure!(rent_per_month > 0, HotelError::InvalidRentPerMonth);
        ensure!(security_deposit > 0, HotelError::InvalidSecurityDeposit);

        // get `room_id` & `agreement_id`
        let room_id = self.next_room_id();
        let agreement_id = self.next_agreement_id();

        // create a new `Room` object with the given fields
        let new_room = Room {
            room_id,
            agreement_id,
            room_name,
            room_address,
            rent_per_month,
            security_deposit,
            time_stamp,
            vacant: true,
            landlord: caller,
            current_tenant: ZERO_ADDRESS.into(),
            next_rent_due_date: Timestamp::from(0u64),
        };

        // insert room in `Mapping` with respect to key `room_id`
        self.data::<Data>().room.insert(&room_id, &new_room);

        // event call
        self.emit_add_room_event(room_id, caller);

        Ok(room_id)
    }

    #[modifiers(is_normal_user)]
    default fn sign_agreement(&mut self, room_id: RoomId) -> RoomResult {
        // caller of the contract
        let caller = T::env().caller();

        // value transfer while calling contract
        let value = T::env().transferred_value();

        // get the romm of specific `room_id`
        let mut room = match self.data::<Data>().room.get(&room_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        // get the room `landlord`
        let room_landlord = room.landlord;

        // get the total to sign the agreement
        let total_fee = room.rent_per_month + room.security_deposit;

        // check if caller is paying enough `agreement_fee`
        ensure!(value >= total_fee, HotelError::NotEnoughAgreementFee);

        // room must be `vacant` to pass the agreement
        ensure!(room.vacant == true, HotelError::RoomIsNotVacant);

        // transfer `total_fee` to `landlord`
        Self::env()
            .transfer(room_landlord, total_fee)
            .unwrap_or_default();

        // get the `next_room_agreement_id`
        let agreement_id = self.next_agreement_id();

        room.room_id = room_id;
        room.agreement_id = agreement_id;
        room.vacant = false;
        room.current_tenant = caller;

        self.data::<Data>().room.insert(&room_id, &room);

        // create new `RoomAgreement` object with given fields
        let mut agreement = match self.data::<Data>().agreement.get(&agreement_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        agreement.room_id = room_id;
        agreement.agreement_id = agreement_id;
        agreement.lock_in_period = 1;

        // insert room `sign_agreement` to the agreement mapping
        self.data::<Data>()
            .agreement
            .insert(&agreement_id, &agreement);

        // get the `next_rent_id`
        let rent_id = self.next_rent_id();

        // create new `Rent` object with the given fields
        let mut rent = match self.data::<Data>().rent.get(&rent_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        rent.rent_id = rent_id;
        rent.room_id = room_id;
        rent.tenant_address = caller;
        rent.land_lord_address = room_landlord;

        // insert `Rent` in the rent mapping
        self.data::<Data>().rent.insert(&rent_id, &rent);

        // Update room rent quantity
        let rent_count = self
            .data::<Data>()
            .room_rent_quantity
            .get(&caller)
            .unwrap_or_default();
        self.data::<Data>()
            .room_rent_quantity
            .insert(&caller, &(rent_count + 1));

        // call the event
        self.emit_sign_agreement_event(room_id, caller);

        Ok(room_id)
    }

    default fn pay_rent(&mut self, room_id: RoomId) -> RoomResult {
        let caller = T::env().caller();
        let value = T::env().transferred_value();

        // get the room and check whether it exists or not
        let mut room = match self.data::<Data>().room.get(&room_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        // check `caller` is same as `room.tenant_address`
        ensure!(caller == room.current_tenant, HotelError::NotATenantAddress);

        // check `rent` is enough to pay
        ensure!(value >= room.rent_per_month, HotelError::NotEnoughRentFee);

        // check if it is time to pay rent for the room
        let land_lord = room.landlord;
        let rent = room.rent_per_month;

        // transfer `rent` to the `land_lord`
        Self::env().transfer(land_lord, rent).unwrap_or_default();

        room.vacant = false;
        room.current_tenant = caller;

        self.data::<Data>().room.insert(&room_id, &room);

        // get the `rent_id` & `agreement_id`
        let rent_id = self.next_rent_id();
        let agreement_id = self.next_agreement_id();

        // create new `Rent` object with the given fields
        let rent = Rent {
            rent_id,
            room_id,
            agreement_id,
            room_name: room.room_name,
            room_address: room.room_address,
            rent_per_month: room.rent_per_month,
            time_stamp: room.time_stamp,
            tenant_address: caller,
            land_lord_address: land_lord,
        };

        // insert `rent` to the mapping
        self.data::<Data>().rent.insert(&rent_id, &rent);

        self.emit_rent_payment_event(room_id, caller);

        Ok(room_id)
    }

    #[modifiers(only_owner)]
    default fn agreement_completed(&mut self, room_id: RoomId) -> RoomResult {
        let mut room = match self.data::<Data>().room.get(&room_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        // check if room is not vacant
        ensure!(room.vacant == false, HotelError::RoomIsVacant);

        // get the `current_tenant` & `security_deposit`
        let current_tenant = room.current_tenant;
        let security_deposit = room.security_deposit;

        // transfer `security_deposit` to  the `current_tenant` after complete agreement
        Self::env()
            .transfer(current_tenant, security_deposit)
            .unwrap_or_default();

        room.vacant = true;
        room.current_tenant = ZERO_ADDRESS.into();

        self.data::<Data>().room.insert(&room_id, &room);

        self.emit_agreement_complete_event(room_id);

        Ok(room_id)
    }

    #[modifiers(only_owner)]
    default fn agreement_terminated(&mut self, room_id: RoomId) -> RoomResult {
        let mut room = match self.data::<Data>().room.get(&room_id) {
            Some(value) => value,
            None => return Err(HotelError::RoomNotFound),
        };

        // can only terminate agreement if room is not vacant
        ensure!(room.vacant == false, HotelError::RoomIsVacant);

        room.vacant = true;
        room.current_tenant = ZERO_ADDRESS.into();

        self.data::<Data>().room.insert(&room_id, &room);
        self.emit_agreement_terminated_event(room_id);
        Ok(room_id)
    }

    // owner of the contract allowed to view all the rooms
    #[modifiers(only_owner)]
    default fn get_room(&mut self) -> Result<Vec<Room>, HotelError> {
        let mut room: Vec<Room> = Vec::new();
        for room_id in 0..self.data::<Data>().room_id {
            match self.data::<Data>().room.get(&room_id) {
                Some(value) => room.push(value),
                None => (),
            }
        }

        Ok(room)
    }

    // get how many times did user rent room
    fn get_room_rent_count(&self, user: AccountId) -> Option<i32> {
        self.data::<Data>().room_rent_quantity.get(&user)
    }

    // get the available rooms from the hotel
    default fn get_available_room(&self) -> Vec<Room> {
        let mut room: Vec<Room> = Vec::new();
        for room_id in 0..self.data::<Data>().room_id {
            match self.data::<Data>().room.get(&room_id) {
                Some(value) => {
                    if value.vacant == true {
                        room.push(value)
                    }
                }
                None => (),
            }
        }

        room
    }

    fn get_landlord(&self) -> AccountId {
        self.data::<Data>().land_lord.clone()
    }

    default fn next_room_id(&mut self) -> RoomId {
        let room_id = self.data::<Data>().room_id;
        self.data::<Data>().room_id += 1;
        room_id
    }

    default fn next_agreement_id(&mut self) -> AgreementId {
        let agreement_id = self.data::<Data>().agreement_id;
        self.data::<Data>().agreement_id += 1;
        agreement_id
    }

    default fn next_rent_id(&mut self) -> RentId {
        let rent_id = self.data::<Data>().rent_id;
        self.data::<Data>().rent_id += 1;
        rent_id
    }
}

impl<T> HotelRoomBookingEvents for T
where
    T: Storage<Data>,
{
    default fn emit_add_room_event(&self, _room_id: RoomId, _owner: AccountId) {}
    default fn emit_sign_agreement_event(&self, _room_id: RoomId, _agreement_signer: AccountId) {}
    default fn emit_rent_payment_event(&self, _room_id: RoomId, _rent_payment_signer: AccountId) {}
    default fn emit_agreement_complete_event(&self, _room_id: RoomId) {}
    default fn emit_agreement_terminated_event(&self, _room_id: RoomId) {}
}

// modifier to check normal user
#[modifier_definition]
pub fn is_normal_user<T, F, R, E>(instance: &mut T, body: F) -> Result<R, E>
where
    T: Storage<Data>,
    F: FnOnce(&mut T) -> Result<R, E>,
    E: From<HotelError>,
{
    ensure!(
        T::env().caller() != instance.data().land_lord,
        HotelError::CallerIsOwner
    );
    body(instance)
}
