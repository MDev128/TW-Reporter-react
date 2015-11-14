import React, { Component, PropTypes } from 'react';

import { connect } from 'react-redux'
import { loadArticles } from '../actions/articles'
import _ from 'lodash'
import NotFound from './NotFound'
import Header from '../components/Header'
import NavBar from '../components/NavBar'
import Tags from '../components/Tags'
import Footer from '../components/Footer'

export default class Category extends Component {
    static fetchData({ query, params, store, history }) {
        return store.dispatch(loadArticles(params.category));
    }
    constructor(props, context) {
        super(props)
        this.tags = this.props.params.category
        this.props.loadArticles(this.tags);
        this.context = context;
    }

    render() {
        var { router } = this.context;
        const { articles } = this.props
        return (
            <div>
                <Header/>
                <NavBar/>
                <Tags articles={articles}/>
                {this.props.children}
                <Footer/>
             </div>
        )
    }
}

function mapStateToProps (state) {
      return { 
          articles: state.articles 
      };
}


export { Category };
export default connect(mapStateToProps, { loadArticles })(Category);
