import type { On } from 'claude-code'

/**
 * The engine's own drawing of every component, beneath the plugin: one
 * `Text` keyed `row`.
 */
export const engineRow = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text key="row">{`engine ${e.component}`}</Text>
  })
