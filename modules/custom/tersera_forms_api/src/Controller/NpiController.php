<?php

namespace Drupal\tersera_forms_api\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

use Drupal\tersera_forms_api\Controller\VeevaController;

//error_reporting(E_ALL);
//ini_set('display_errors', TRUE);
//ini_set('display_startup_errors', TRUE);

class NpiController {

  /**
   * @return JsonResponse
   */
  public function index() {
    return new JsonResponse([ 'data' => $this->getData(), 'method' => 'GET', 'status'=> 200]);
  }

  public function npiLookupById(String $npi, Request $request) {
    // Search NPI by ID
    $veeva = new VeevaController();
    return new JsonResponse($veeva->GetNpiByID($npi));
  }

  public function npiLookup(Request $request) {
    $params = $_GET ?? array();
    $veeva = new VeevaController();
    return new JsonResponse($veeva->NpiSearch($params));
  }

}
