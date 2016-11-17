'use strict'

import React from 'react'
import { fetchAuthorsIfNeeded } from '../actions/authors'
import { connect } from 'react-redux'
import ShownAuthors from '../components/authors/ShownAuthors'
import get from 'lodash/get'
import map from 'lodash/map'
import values from 'lodash/values'
import styles from '../components/authors/AuthorList.scss'
import LoadMore from '../components/authors/LoadMore'

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
    return (
      <div className={styles['author-list-container']}>
        <ShownAuthors filteredAuthors={authorsArray} />
        <LoadMore isFinish={this.props.isFinish} fetchAuthorsIfNeeded={this.props.fetchAuthorsIfNeeded} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    entities: state.entities || {},
    isFinish: state.authorsList.isFinish
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchAuthorsIfNeeded: () => {dispatch(fetchAuthorsIfNeeded())}
  }
}

export { AuthorsList }
export default connect(mapStateToProps, mapDispatchToProps)(AuthorsList)
