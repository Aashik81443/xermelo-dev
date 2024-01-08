<?php

namespace Drupal\conditional_404_pages\Form;

use Drupal\Core\Condition\ConditionManager;
use Drupal\Core\Entity\EntityForm;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\Entity\Node;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Class Conditional404PageForm.
 */
class Conditional404PageForm extends EntityForm {

  /**
   * The path condition.
   *
   * @var \Drupal\system\Plugin\Condition\RequestPath
   */
  protected $pathConditionPlugin;

  /**
   * Conditional404PageForm constructor.
   *
   * @param \Drupal\Core\Condition\ConditionManager $condition_plugin_manager
   *   The condition plugin manager.
   *
   * @throws \Drupal\Component\Plugin\Exception\PluginException
   */
  public function __construct(ConditionManager $condition_plugin_manager) {
    $this->pathConditionPlugin = $condition_plugin_manager->createInstance('request_path');
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('plugin.manager.condition')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function form(array $form, FormStateInterface $form_state) {
    $form = parent::form($form, $form_state);

    /** @var \Drupal\conditional_404_pages\Entity\Conditional404Page $conditional_404_page */
    $conditional_404_page = $this->entity;

    $form['label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#maxlength' => 255,
      '#default_value' => $conditional_404_page->label(),
      '#description' => $this->t('Label for the Conditional 404 Page.'),
      '#required' => TRUE,
    ];

    $form['id'] = [
      '#type' => 'machine_name',
      '#default_value' => $conditional_404_page->id(),
      '#machine_name' => [
        'exists' => '\Drupal\conditional_404_pages\Entity\Conditional404Page::load',
      ],
      '#disabled' => !$conditional_404_page->isNew(),
    ];

    $form['weight'] = [
      '#type' => 'weight',
      '#title' => $this->t('Weight'),
      '#description' => $this->t('Select a weight for this 404 Page Configuration. If there are two configurations that apply to the same path, the item with the highest weight will have priority.'),
      '#default_value' => $conditional_404_page->getWeight(),
      '#delta' => 50,
      '#required' => TRUE,
    ];

    $form['page'] = [
      '#type' => 'entity_autocomplete',
      '#title' => $this->t('Page'),
      '#description' => $this->t('Select the node to display in the event of a 404.'),
      '#target_type' => 'node',
      '#default_value' => $conditional_404_page->getPage() ? Node::load($conditional_404_page->getPage()) : '',
    ];

    // Instantiate path condition plugin with entity's stored configuration.
    $this->pathConditionPlugin->setConfiguration($conditional_404_page->getPathCondition());
    // Build the path_condition configuration form elements.
    $form += $this->pathConditionPlugin->buildConfigurationForm($form, $form_state);
    // Remove negate options; we're not going to support it at this time.
    unset($form['negate']);

    // Customize the label provided by the plugin's config form.
    $form['pages']['#title'] = $this->t('Path Conditions');
    // Combine plugin's help text with our own.
    $help_text = 'Provide pages/paths that will use this 404 configuration.';
    $help_text .= $form['pages']['#description']->__toString();
    $form['pages']['#description'] = $this->t($help_text);

    $form['status'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#description' => $this->t('Mark this checkbox to enable this conditional 404 configuration.'),
      '#default_value' => $conditional_404_page->getStatus(),
      '#return_value' => TRUE,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Submit condition plugin configurations.
    $this->pathConditionPlugin->submitConfigurationForm($form, $form_state);

    $form_state->setValue('pages', $this->pathConditionPlugin->getConfiguration());

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state) {
    /** @var \Drupal\conditional_404_pages\Entity\Conditional404Page $conditional_404_page */
    $conditional_404_page = $this->entity;
    $conditional_404_page->setPathCondition($form_state->getValue('pages'));

    $status = $conditional_404_page->save();

    switch ($status) {
      case SAVED_NEW:
        $this->messenger()->addMessage($this->t('Created the %label Conditional 404 Page.', [
          '%label' => $conditional_404_page->label(),
        ]));
        break;

      default:
        $this->messenger()->addMessage($this->t('Saved the %label Conditional 404 Page.', [
          '%label' => $conditional_404_page->label(),
        ]));
    }
    $form_state->setRedirectUrl($conditional_404_page->toUrl('collection'));
  }

}
