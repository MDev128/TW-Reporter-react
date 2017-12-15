'use strict'
import React, { PureComponent } from 'react'
import enLocaleData from 'react-intl/locale-data/en'
import zhLocaleData from 'react-intl/locale-data/zh'
// import locale data
import { addLocaleData, IntlProvider } from 'react-intl'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { signOutAction } from '@twreporter/registration'

// lodash
import get from 'lodash/get'

const _ = {
  get
}

addLocaleData(enLocaleData)
addLocaleData(zhLocaleData)
let currentLocale = 'zh-Hant'

class App extends PureComponent {
  getChildContext() {
    const { location, ifAuthenticated, signOutAction } = this.props
    return {
      location,
      ifAuthenticated,
      signOutAction
    }
  }

  componentWillMount() {
    // set current locale
    if (process.env.BROWSER) {
      currentLocale = navigator.language
      addLocaleData({
        locale: navigator.language,
        parentLocale: navigator.language.split('-')[0]
      })
    }
  }

  render() {
    return (
      <IntlProvider locale={currentLocale} defaultLocale="zh-Hant">
        {this.props.children}
      </IntlProvider>
    )
  }
}

App.childContextTypes = {
  location: PropTypes.object,
  ifAuthenticated: PropTypes.bool.isRequired,
  signOutAction: PropTypes.func.isRequired
}

function mapStateToProps(state) {
  return {
    header: _.get(state, 'header'),
    ifAuthenticated: _.get(state, [ 'auth', 'authenticated' ], false)
  }
}

export default connect(mapStateToProps, { signOutAction })(App)
