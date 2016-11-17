'use strict'

import LoadMore from '../components/authors/LoadMore'
import React from 'react'
import ShownAuthors from '../components/authors/ShownAuthors'
import VisibilitySensor from 'react-visibility-sensor'
import { connect } from 'react-redux'
import { fetchAuthorsIfNeeded } from '../actions/authors'
import get from 'lodash/get'
import map from 'lodash/map'
import styles from '../components/authors/AuthorList.scss'
import values from 'lodash/values'

const _ = {
  get: get,
  map: map,
  values: values
}

class AuthorsList extends React.Component {
  static fetchData({ store }) {
    return store.dispatch(fetchAuthorsIfNeeded())
  }

  constructor(props) {
    super(props)
  }

  render() {
    function iteratee(oldValue) {
      let newValue = {
        id: get(oldValue, 'id'),
        authorName: get(oldValue, 'name'),
        authorImg: get(oldValue, 'image', 'http://i.imgur.com/Clyp3sKb.jpg'),
        authorUrl: get(oldValue, [ 'links', 'self', 'href' ])
      }
      return newValue
    }

    const authorsArray = _.map(_.values(this.props.entities.authors), iteratee)

    let handleSeen = (isVisible) => {
      if (this.props.currentPage>1 && isVisible === true) {
        this.props.fetchAuthorsIfNeeded()
      }
      return
    }
    //
    let bottomDisplay = () => {
      let options = { loadmore: false, sensor: false }
      if (this.props.currentPage <= 1) {
        options.loadmore = true
      }
      if (this.props.currentPage>1 && !this.props.isFinish) {
        options.sensor = true
      }
      return options
    }

    let bottomDisplayOptions = bottomDisplay()

    return (
      <div className={styles['author-list-container']}>
        <ShownAuthors filteredAuthors={authorsArray} />
        {!bottomDisplayOptions.loadmore ? null:
        <LoadMore isFinish={this.props.isFinish} fetchAuthorsIfNeeded={this.props.fetchAuthorsIfNeeded} />}
        {!bottomDisplayOptions.sensor ? null:
        <VisibilitySensor onChange={handleSeen} partialVisibility={true}>
          <div className={styles['sensor']}></div>
        </VisibilitySensor>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    entities: state.entities || {},
    isFinish: state.authorsList.isFinish,
    currentPage: state.authorsList.currentPage
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchAuthorsIfNeeded: () => {dispatch(fetchAuthorsIfNeeded())}
  }
}

export { AuthorsList }
export default connect(mapStateToProps, mapDispatchToProps)(AuthorsList)
