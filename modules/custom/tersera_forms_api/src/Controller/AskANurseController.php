<?php

namespace Drupal\tersera_forms_api\Controller;
use Drupal\tersera_forms_api\Models\AskANurseEntry;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Site\Settings;
use Exception;

//error_reporting(E_ALL);
//ini_set('display_errors', TRUE);
//ini_set('display_startup_errors', TRUE);


class AskANurseController extends ControllerBase {
  // public function cneTest(Request $request) {
  //   $postData = json_decode($request->getContent());
  //   return new JsonResponse([ 'data' => $postData, 'method' => $_SERVER['REQUEST_METHOD'], 'endpoint' => Settings::get('workup_endpoint'), 'status' => 200]);
  // }

  public function submit(Request $request) {
    // Prepare our response object
    $results = array();

    try {
      // Load the posted data
      $postData = json_decode($request->getContent(), true);
      $entry = new AskANurseEntry($postData);

      // Do some basic validation
      if (empty($entry->firstName)) {
        throw new Exception("firstName");
      }

      if (empty($entry->lastName)) {
        throw new Exception("lastName");
      }

      if (
        // Pattern pulled from the frontend to match - there are other ways
        // of validating email in PHP but not doing that for now
        !preg_match(
          '/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/',
          $entry->email
        )
      ) {
        throw new Exception("email");
      }

      if (!preg_match('/^\(\d{3}\) \d{3}-\d{4}$/', $entry->phone)) {
        throw new Exception("phone");
      }

      // Zip code is no longer on the form - removing
      //if (!preg_match('/^\d{5}$/', $entry->zipcode)) {
      //  throw new Exception("zip");
      //}

      // Success - send the data
      $data_string = json_encode($entry);
      $url = Settings::get('workup_endpoint');

      $ch = curl_init($url);
      if ($ch === false) {
        throw new Exception('failed to initialize');
      }

      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS,$data_string);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'content-type: application/json',
        'wu-consumer-access-id: ' . Settings::get('workup_id'),
        'wu-consumer-access-token: ' . Settings::get('workup_token')
      ));

      $data = curl_exec($ch);
      if ($data === false) {
        throw new Exception(curl_error($ch), curl_errno($ch));
      }

      curl_close($ch);

      // Decode the response and check the response code - it returns
      // 201 ("Created") generally
      $response = json_decode($data);
      if ($response->status < 200 || $response->status > 299) {
        throw new Exception($response->message, $response->status);
      }

      $data = $response->data;

      // return ID from response for GA tracking
      if (!is_null($data)) {
        $results['id'] = $data->_id ?? 0;
      } else {
        $results['output'] = $response;
      }

      // Return a success indicator
      $results['success'] = true;
    } catch (Exception $e) {
      // Return an error indicator and associated message;
      // the frontend could theoretically use this
      $results['success'] = false;
      $results['error-code'] = $e->getCode();
      $results['error-msg'] = $e->getMessage();
    }

    // Return JSON response
    // header('Content-Type: application/json');
    return new JsonResponse($results);
  }

}
