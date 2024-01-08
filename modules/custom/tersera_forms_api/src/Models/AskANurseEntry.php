<?php

namespace Drupal\tersera_forms_api\Models;

class AskANurseEntry {
  public $firstName;
  public $lastName;
  public $email;
  public $phone;
  public $zipcode;
  public $prefCallTime;
  public $city;
  public $state;

  function __construct($args) {
    $this->firstName = load_text_value($args, 'firstName');
    $this->lastName = load_text_value($args, 'lastName');
    $this->email = load_text_value($args, 'email');
    $this->phone = load_text_value($args, 'phone');
    $this->zipcode = load_text_value($args, 'zip');

    // The API requires this - we have nothing to base this
    // off of, and it must be one of a few accepted values.
    // An empty string is one of the accepted values, thankfully
    $this->prefCallTime = '';

    // These were added 2/2023 per a request from D2
    $this->city = '';
    $this->state = '';
  }
}

function load_text_value($args, $name) {
  $value = $args[$name] ?? '';
  return trim($value);
}
