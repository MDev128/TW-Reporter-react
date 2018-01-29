import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import baseComponents from './base-components'
import { globalColor } from '../../themes/common-variables'
import { screen } from '../../themes/screen'

// writing-mode: vertical-rl;
// letter-spacing: 2px;
const StyledAnchor = baseComponents.StyledAnchor.extend`
  margin-bottom: 18px;
  color: ${props => (props.highlight ? 'white' : `${globalColor.primaryColor}`)};
  background: ${props => (props.highlight ? `${globalColor.primaryColor}` : 'none')};
`

class Anchors extends baseComponents.Anchors {
  constructor(props) {
    super(props)
    this.Anchor = StyledAnchor
  }
}

const SideBarContainer = styled.div`
  position: fixed;
  top: 50%;
  z-index: 100;
  transform: translateY(-50%);
  color: ${globalColor.primaryColor};
  right: 16px;
  ${screen.tablet`
    right: 3px;
  `}
  ${screen.mobile`
    display: none;
  `}
`

class HomePageSideBar extends React.PureComponent {
  render() {
    // currentAnchorId and handleClickAnchor are passed from `SideBarHOC`
    const { anchors, children, currentAnchorId, handleClickAnchor } = this.props
    return (
      <div>
        <SideBarContainer>
          <Anchors
            ref={(node) => { this.anchorsNode = node }}
            data={anchors}
            handleClickAnchor={handleClickAnchor}
            currentAnchorId={currentAnchorId}
          />
        </SideBarContainer>
        {children}
      </div>
    )
  }
}

HomePageSideBar.defaultProps = {
  currentAnchorId: '',
  handleClickAnchor: () => {}
}

HomePageSideBar.propTypes = {
  anchors: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string
  })).isRequired,
  currentAnchorId: PropTypes.string,
  handleClickAnchor: PropTypes.func
}

export default HomePageSideBar
