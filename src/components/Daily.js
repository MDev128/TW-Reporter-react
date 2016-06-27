import _ from 'lodash'
import React, { Component } from 'react'
import { date2yyyymmdd } from '../lib/date-transformer'
import { imageComposer } from '../lib/image-composer'

if (process.env.BROWSER) {
  require('./Daily.css')
}

export default class Daily extends Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { daily } = this.props
    let dailyTop = []
    if ( daily ) { dailyTop = daily.slice(0, 6) }
    return dailyTop ? (
      <div className="daily">
        <div className="daily-news">
          <div className="what">觀&nbsp;點</div>
        </div>
        <div className="daily-itemlistwrapprt">
          <ul className="daily-itemlist">
          { _.map(dailyTop, (a, idx) => {
            const pubDate = date2yyyymmdd(a.publishedDate, '.')
            if (a.state == 'published') {
              let imageSet = imageComposer(a)
              let thumbnail = imageSet.mobileImage
              let url = '/a/' + a.slug
              return (
                <li className="daily-item" key={a.id || idx}>
                  <a className="clearfix" href={url}>
                    <div className="daily-image" >
                      <div style={{
                        backgroundImage: 'url(' + thumbnail + ')'
                      }}/>
                    </div>
                    <div className="daily_lastpublish">{pubDate}</div>
                    {a.title}
                  </a>
                </li>
              )
            }
          })}
          </ul>
        </div>
      </div>
    ) : null
  }
}

export { Daily }
