<?php


namespace Drupal\tersera_forms_api\Controller;

use Drupal\tersera_forms_api\Models\HCP;
use Exception;

class VeevaController {
  public $connected = false;
  private $sessionID;

  public function authorize() {
    $ch = curl_init('https://tersera.veevanetwork.com/api/v12.0/auth');
    $auth = array(
      'username' => 'websitelookup@tersera.veevanetwork.com',
      'password' => '48VTR4Dm66Fndl8XjVA'
    );
    if ($ch === false) {
      throw new Exception('failed to initialize');
    }
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($auth));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
      'content-type: application/x-www-form-urlencoded'
    ));
    $data = curl_exec($ch);
    if ($data === false) {
      throw new Exception(curl_error($ch), curl_errno($ch));
    }
    curl_close($ch);
    $response = json_decode($data);

    if (isset($response->responseStatus) && $response->responseStatus == 'SUCCESS') {
      $this->sessionID = $response->sessionId;
      $this->connected = true;
    }

    return $this->connected;
  }

  public function getSessionId() {

  }

  public function getRequest($url) {
    $ch = curl_init($url);
    if ($ch === false) {
      throw new Exception('failed to initialize');
    }
    $headers = array(
      'content-type: application/json',
      'Authorization: ' . $this->sessionID
    );
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $data = curl_exec($ch);
    if ($data === false) {
      throw new Exception(curl_error($ch), curl_errno($ch));
    }
    curl_close($ch);
    return json_decode($data);
  }

  public function GetNpiByID($id) {
    // example: 1336201474
    $this->getSessionId();
    $results = array();
    $results['npi'] = $id;

    $auth = $this->authorize();

    if ($this->connected) {
      $results['sessionID'] = $this->sessionID;
    }

    $filters = array(
      'q' => '*',
      'limit' => '1',
      'filters' => 'npi_num__v:' . $id,
      'sortResultChildren' => 'True'
    );

    $url = "https://tersera.veevanetwork.com/api/v12.0/search?" . http_build_query($filters);
    $request = $this->getRequest($url);
    $results['data'] = null;

    if (isset($request->entities)) {
      $items = $request->entities;
      if (count($items) >= 1) {
        $firstHCP = $items[0];
        $hcp = new HCP($firstHCP->entity);
        $hcp->getAddress();
        $results['data'] = $hcp;
      }
    }

//    header('Content-Type: application/json');
    return $results;
  }

  public function BuildFilters($params) {
    // only prescribing HCP's in the US
    $filters = "primary_country__v:US";
    /*
         Filter by HCP Type = P - Removed on 12/15 because it was removing items with NPI numbers
        // $filters .= "~hcp_type__v:P";
    */
    if (isset($params['state'])) {
      $filters .= "~address.administrative_area__v:US-" . $params['state'];
    }
    return $filters;
  }

  public function BuildQueries($params) {
    $filters = "";
    if (isset($params['city'])) {
      $filters .= "~address.locality__v::" . $params['city'];
    }
    if (isset($params['first-name'])) {
      $filters .= "~first_name__v:" . $params['first-name'];
    }

    if (isset($params['last-name'])) {
      $filters .= "~last_name__v:" . $params['last-name'];
    }
    return $filters;
  }

  public function NpiSearch($params) {
    /* Example:
    https://tersera.veevanetwork.com/api/v12.0/search?
                q=*&types=HCP
                &filters=primary_country__v:US~address.administrative_area__v:US-IL
                &fieldQueries=address.locality__v:Chicago~last_name__v:Galvan
    */
    $results = array();
    // last name and state required
    if ( !isset($params['last-name']) || !isset($params['state']) || !isset($params['first-name']) ) {
      $results['success'] = false;
      $results['msg'] = 'Missing required state or first / last name';
    } else {
      $this->getSessionId();

      $auth = $this->authorize();

      if ($this->connected) {
        $results['sessionID'] = $this->sessionID;
      }

      $filters = array(
        'q' => '*',
        'nestChildObjectFieldQueries' => 'true',
        'limit' => '100',
        'types' => 'HCP',
        'filters' => $this->BuildFilters($params),
        'fieldQueries' => $this->BuildQueries($params),
        'sortResultChildren' => 'True'
      );

      $url = "https://tersera.veevanetwork.com/api/v12.0/search?" . http_build_query($filters);

      //$url = "https://tersera.veevanetwork.com/api/v12.0/search?q=*&types=HCP&filters=primary_country__v:US~address.administrative_area__v:US-IL&fieldQueries=address.locality__v:Chicago~last_name__v:Galvan";
      $request = $this->getRequest($url);

      if(isset($params['debug'])) {
        $results['output'] = $request;
      }

      $hcpList = array();
      if (isset($request->entities)) {
        $count = 0;
        foreach($request->entities as $entity) {
          // remove any entries without NPI numbers, limit to top 50
          if ($count < 100 && isset($entity->entity->npi_num__v)) {
            $count++;
            $hcp = new HCP($entity->entity);
            $hcp->getAddress($params['state'], $params['city'] ?? null);
            array_push($hcpList, $hcp);
          }
        }
      } else {
        // no results
      }
      $results['totalCount'] = $request->totalCount ?? 0;
      $results['url'] = $url;
      $results['data'] = $hcpList;
    }

//    header('Content-Type: application/json');
//    echo json_encode( $results );
    return $results;
  }
}
