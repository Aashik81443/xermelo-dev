<?php

namespace Drupal\conditional_404_pages;

use Drupal\Component\Plugin\Exception\PluginException;
use Drupal\conditional_404_pages\Entity\Conditional404Page;
use Drupal\Core\Condition\ConditionManager;
use Drupal\Core\Entity\EntityTypeManager;
use Drupal\path_alias\AliasManager;

/**
 * Class Conditional404PageService.
 *
 * This service provides functionality to retrieve Conditional 404 Page
 * config entities that meet the specified conditions, and from those,
 * retrieve configuration from the entity with the highest weight.
 *
 * @package Drupal\conditional_404_pages
 */
class Conditional404PageService {
  /**
   * The condition manager.
   *
   * @var \Drupal\Core\Condition\ConditionManager
   */
  protected $conditionManager;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManager
   */
  protected $entityTypeManager;

  /**
   * The path alias manager.
   *
   * @var \Drupal\Core\Path\AliasManager
   */
  protected $aliasManager;

  /**
   * Conditional404PageService constructor.
   *
   * @param \Drupal\Core\Condition\ConditionManager $condition_manager
   *   The condition manager.
   * @param \Drupal\Core\Entity\EntityTypeManager $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\path_alias\AliasManager $alias_manager
   *   The alias manager.
   */
  public function __construct(ConditionManager $condition_manager, EntityTypeManager $entity_type_manager, AliasManager $alias_manager) {
    $this->conditionManager = $condition_manager;
    $this->entityTypeManager = $entity_type_manager;
    $this->aliasManager = $alias_manager;
  }

  /**
   * Gets the conditional 404 entities that apply to the current 404 path.
   *
   * @return array
   *   The applicable conditional 404 page config entities.
   */
  public function getApplicableConfigEntities() {
    $applicable_configuration = [];

    $storage = $this->entityTypeManager->getStorage('conditional_404_page');

    /** @var Conditional404Page[] $conditional_config */
    $conditional_config = $storage->loadByProperties(['status' => TRUE]);

    if (!empty($conditional_config)) {
      /** @var \Drupal\system\Plugin\Condition\RequestPath $condition */
      $condition = $this->conditionManager->createInstance('request_path');

      foreach ($conditional_config as $config) {
        $path_condition = $config->getPathCondition();

        if (!empty($path_condition) && is_array($path_condition)) {
          $condition->setConfiguration($path_condition);

          if ($condition->evaluate()) {
            $applicable_configuration[] = $config;
          }
        }
      }
    }
    return $applicable_configuration;
  }

  /**
   * Gets the path from the applicable entity with the highest weight.
   *
   * This function returns the path of the associated node, which is needed
   * to make a subrequest when a 404 is thrown.
   *
   * @param array $config_entities
   *   The applicable config entities.
   *
   * @return string
   *   The path.
   *
   * @see \Drupal\conditional_404_pages\EventSubscriber\ConditionalPageExceptionHtmlSubscriber::on404()
   */
  public function getConditional404Path(array $config_entities) {
    usort($config_entities, function (Conditional404Page $a, Conditional404Page $b) {
      return $a->getWeight() < $b->getWeight() ? 1 : -1;
    });
    $nid = reset($config_entities)->getPage();
    return $this->aliasManager->getAliasByPath('/node/' . $nid);
  }

}
