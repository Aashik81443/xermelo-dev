<?php

namespace Drupal\conditional_404_pages\Entity;

use Drupal\Core\Config\Entity\ConfigEntityBase;

/**
 * Defines the Conditional 404 Page entity.
 *
 * @ConfigEntityType(
 *   id = "conditional_404_page",
 *   label = @Translation("Conditional 404 Page"),
 *   handlers = {
 *     "view_builder" = "Drupal\Core\Entity\EntityViewBuilder",
 *     "list_builder" = "Drupal\conditional_404_pages\Conditional404PageListBuilder",
 *     "form" = {
 *       "add" = "Drupal\conditional_404_pages\Form\Conditional404PageForm",
 *       "edit" = "Drupal\conditional_404_pages\Form\Conditional404PageForm",
 *       "delete" = "Drupal\conditional_404_pages\Form\Conditional404PageDeleteForm"
 *     },
 *     "route_provider" = {
 *       "html" = "Drupal\conditional_404_pages\Conditional404PageHtmlRouteProvider",
 *     },
 *   },
 *   config_prefix = "conditional_404_page",
 *   admin_permission = "administer conditional 404 page configuration",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "label",
 *     "uuid" = "uuid",
 *     "weight" = "weight"
 *   },
 *   config_export = {
 *     "id",
 *     "label",
 *     "page",
 *     "pathCondition",
 *     "status",
 *     "weight",
 *   },
 *   links = {
 *     "canonical" = "/admin/structure/conditional_404_page/{conditional_404_page}",
 *     "add-form" = "/admin/structure/conditional_404_page/add",
 *     "edit-form" = "/admin/structure/conditional_404_page/{conditional_404_page}/edit",
 *     "delete-form" = "/admin/structure/conditional_404_page/{conditional_404_page}/delete",
 *     "collection" = "/admin/structure/conditional_404_page"
 *   }
 * )
 */
class Conditional404Page extends ConfigEntityBase implements Conditional404PageInterface {

  /**
   * The Conditional 404 Page ID.
   *
   * @var string
   */
  protected $id;

  /**
   * The Conditional 404 Page label.
   *
   * @var string
   */
  protected $label;

  /**
   * The id of the page to display when the conditions are met.
   *
   * @var string
   *  The target page id.
   */
  protected $page;

  /**
   * The 404 Page path condition configuration.
   *
   * @var array
   *  The applicable paths to apply the conditional 404 configuration.
   */
  protected $pathCondition = [];

  /**
   * The Conditional 404 Page enabled or disabled status.
   *
   * @var bool
   *   The status of the Conditional 404 Page.
   */
  protected $status;

  /**
   * The Conditional 404 Page weight.
   *
   * @var int
   *   The weight of the Conditional 404 Page.
   */
  protected $weight;

  /**
   * {@inheritdoc}
   */
  public function getPage() {
    return $this->page;
  }

  /**
   * {@inheritdoc}
   */
  public function setPage($page) {
    $this->set('page', $page);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getPathCondition() {
    return $this->pathCondition;
  }

  /**
   * {@inheritdoc}
   */
  public function setPathCondition($condition) {
    $this->set('pathCondition', $condition);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getStatus() {
    return $this->status;
  }

  /**
   * {@inheritdoc}
   */
  public function setStatus($status) {
    $this->set('status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getWeight() {
    return $this->weight;
  }

  /**
   * {@inheritdoc}
   */
  public function setWeight($weight) {
    $this->weight = $weight;
    return $this;
  }

}
