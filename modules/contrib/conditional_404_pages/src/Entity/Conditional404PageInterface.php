<?php

namespace Drupal\conditional_404_pages\Entity;

use Drupal\Core\Config\Entity\ConfigEntityInterface;

/**
 * Provides an interface for defining Conditional 404 Page entities.
 */
interface Conditional404PageInterface extends ConfigEntityInterface {

  /**
   * Returns the page property.
   *
   * @return string
   *   The page condition.
   */
  public function getPage();

  /**
   * Sets the id of the page to display when 404 conditions are met.
   *
   * @param string $page
   *   The page.
   */
  public function setPage($page);

  /**
   * Returns the path condition property.
   *
   * @return array
   *   The path condition.
   */
  public function getPathCondition();

  /**
   * Sets the path condition that the configuration applies to.
   *
   * @param array $condition
   *   The path condition.
   */
  public function setPathCondition(array $condition);

  /**
   * Returns the status property.
   *
   * @return bool
   *   The status.
   */
  public function getStatus();

  /**
   * Sets the status property.
   *
   * @param bool $status
   *   The status.
   */
  public function setStatus($status);

  /**
   * Returns the weight property.
   *
   * @return int
   *   The weight.
   */
  public function getWeight();

  /**
   * Sets the weight property. Higher values take priority over lower values.
   *
   * @param int $weight
   *   The weight.
   */
  public function setWeight($weight);

}
