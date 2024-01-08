<?php

namespace Drupal\tersera_forms_api\Models;

class HCP {
  public $npi; //npi_num__v
  public $firstName; // first_name__v
  public $lastName; // last_name__v
  public $fullName; //formatted_name__v
  public $address1; // addresses__v -> address_line_1__v
  public $address2; // addresses__v -> address_line_2__v
  public $city; // addresses__v -> locality__v
  public $state; // addresses__v -> administrative_area__v
  public $zip; // addresses__v -> postal_code_primary__v
  public $phone; // addresses__v -> phone_1__v
  public $email; // email_1__v

  public $key;
  private $addressList;

  private static function ordinalSort($addressA, $addressB) {
    $a = strtotime($addressA->address_ordinal__v ?? 99);
    $b = strtotime($addressB->address_ordinal__v ?? 99);
    if ($a == $b) {
      return 0;
    }
    return ($a < $b) ? 1 : -1;
  }

  public function getAddress($state = null, $city = null) {
    $addressList =  $this->addressList;
    $filteredList =  $this->addressList;
    if (count($addressList)) {
      if (isset($state)) {
        // filter address list by location
        $this->state = $state;
        $this->city = $city;
        $filteredList = array_filter($addressList, function($v) {
          if (isset($this->city)) {
            return $v->administrative_area__v == "US-" . $this->state && $v->locality__v == $this->city;
          }
          return $v->administrative_area__v == "US-" . $this->state;
        });
        if (count($filteredList) == 0) {
          // revert if no matches
          $filteredList =  $this->addressList;
        }
      }
      // if addresses, find the primary one
      $primaryAddress = null;
      $primaryAddressKey = array_search('Y', array_column($filteredList, 'nwk_primary_address__c'));
      $this->key = $primaryAddressKey;
      if ($primaryAddressKey !== false) {
        $primaryAddress = $filteredList[$primaryAddressKey];
      } else {
        // fallback -> Veeva will sort by relevancy using the sortResultChildren field
        if (count($filteredList)) {
          //usort($filteredList, array($this, 'ordinalSort'));
          // removed ordinal sort based on the sortResultChildren field mentioned above
          $primaryAddress = $filteredList[0];
        }
      }
      if (isset($primaryAddress)) {
        $this->address1 = $primaryAddress->address_line_1__v ?? '';
        $this->address2 = $primaryAddress->address_line_2__v ?? '';
        $this->city = $primaryAddress->locality__v ?? '';
        $this->state = $primaryAddress->administrative_area__v ?? '';
        // remove the 'US-' prefix on state names
        $this->state = str_replace("US-", "", $this->state);
        $this->zip = $primaryAddress->postal_code_primary__v ?? '';
        $this->phone = $primaryAddress->phone_1__v ?? '';
        $this->ordinal = $primaryAddress->address_ordinal__v ?? '';
      }
    }
  }

  function __construct($entry) {
    $this->npi = $entry->npi_num__v ?? 'N/A';
    $this->firstName = $entry->first_name__v;
    $this->lastName = $entry->last_name__v;
    $this->fullName = $entry->formatted_name__v;
    $this->addressList = $entry->addresses__v ?? array();
    $this->email = $entry->email_1__v ?? '';
  }
}
