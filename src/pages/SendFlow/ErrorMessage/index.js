import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import PropTypes from 'prop-types'
import { colors, fontStyles } from '../../../styles/common'

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.red000,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 4,
    padding: 15,
  },
  errorMessage: {
    ...fontStyles.normal,
    fontSize: 12,
    color: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default function ErrorMessage(props) {
  const { errorMessage } = props
  return (
    <View style={styles.wrapper} testID={'error-message-warning'}>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
    </View>
  )
}

ErrorMessage.propTypes = {
  /**
   * Error message to display
   */
  errorMessage: PropTypes.string,
}
