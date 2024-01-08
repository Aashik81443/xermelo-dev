<?php

namespace Drupal\conditional_404_pages\EventSubscriber;

use Drupal\conditional_404_pages\Conditional404PageService;
use Drupal\Core\Access\AccessManagerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\EventSubscriber\CustomPageExceptionHtmlSubscriber;
use Drupal\Core\Routing\RedirectDestinationInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Routing\Matcher\UrlMatcherInterface;

/**
 * Class ConditionalPageExceptionHtmlSubscriber.
 *
 * @package Drupal\conditional_404_pages\EventSubscriber
 */
class ConditionalPageExceptionHtmlSubscriber extends CustomPageExceptionHtmlSubscriber {
  /**
   * The conditional 404 page service.
   *
   * @var \Drupal\conditional_404_pages\Conditional404PageService
   */
  protected $conditional404Service;

  /**
   * The original custom page exception subscriber.
   *
   * @var \Drupal\Core\EventSubscriber\CustomPageExceptionHtmlSubscriber
   */
  protected $customPageExceptionHtmlSubscriber;

  /**
   * Constructs a new CustomPageExceptionHtmlSubscriber.
   *
   * @param \Drupal\Core\EventSubscriber\CustomPageExceptionHtmlSubscriber $custom_page_exception_subscriber
   *   The original custom page exception subscriber.
   * @param \Drupal\conditional_404_pages\Conditional404PageService $conditional_404_service
   *   The conditional 404 page service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The configuration factory.
   * @param \Symfony\Component\HttpKernel\HttpKernelInterface $http_kernel
   *   The HTTP Kernel service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   * @param \Drupal\Core\Routing\RedirectDestinationInterface $redirect_destination
   *   The redirect destination service.
   * @param \Symfony\Component\Routing\Matcher\UrlMatcherInterface $access_unaware_router
   *   A router implementation which does not check access.
   * @param \Drupal\Core\Access\AccessManagerInterface $access_manager
   *   The access manager.
   */
  public function __construct(CustomPageExceptionHtmlSubscriber $custom_page_exception_subscriber, Conditional404PageService $conditional_404_service, ConfigFactoryInterface $config_factory, HttpKernelInterface $http_kernel, LoggerInterface $logger, RedirectDestinationInterface $redirect_destination, UrlMatcherInterface $access_unaware_router, AccessManagerInterface $access_manager) {
    $this->conditional404Service = $conditional_404_service;
    $this->customPageExceptionHtmlSubscriber = $custom_page_exception_subscriber;
    parent::__construct($config_factory, $http_kernel, $logger, $redirect_destination, $access_unaware_router, $access_manager);
  }

  /**
   * {@inheritdoc}
   */
  public function on404(GetResponseForExceptionEvent $event) {
    $config_entities = $this->conditional404Service->getApplicableConfigEntities();

    if (!empty($config_entities)) {
      $conditional_404_path = $this->conditional404Service->getConditional404Path($config_entities);
      if (!empty($conditional_404_path)) {
        $this->makeSubrequestToCustomPath($event, $conditional_404_path, Response::HTTP_NOT_FOUND);
      }
    }
    else {
      $custom_404_path = $this->configFactory->get('system.site')->get('page.404');
      if (!empty($custom_404_path)) {
        $this->makeSubrequestToCustomPath($event, $custom_404_path, Response::HTTP_NOT_FOUND);
      }
    }
  }

}
