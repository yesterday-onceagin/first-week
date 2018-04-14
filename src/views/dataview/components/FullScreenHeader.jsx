import React from 'react';
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select';
import Button from 'react-bootstrap-myui/lib/Button';
import IconButton from '../../../components/IconButton';

import './full-screen-header.less';

class FullScreenHeader extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    show: PropTypes.bool,
    full: PropTypes.bool,
    title: PropTypes.string,
    onHide: PropTypes.func,
    onFull: PropTypes.func,
    isNeedHistoryBack: PropTypes.bool,
    autoPlay: PropTypes.object,
    isPage: PropTypes.bool,
    changePage: PropTypes.func,
    visible: PropTypes.bool,
    urlArray: PropTypes.array
  };

  static defaultProps = {
    show: false,
    isPage: true,
    title: '数据报告'
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        isHide: true,
        loaded: true
      })
    }, 1000)
  }

  render() {
    const { title, full, onHide, onFull, autoPlay, visible, isPage, isNeedHistoryBack, urlArray } = this.props;

    return (
      <div className={`dmp-full-screen-header ${!visible ? 'hide-header' : ''}`}
        style={this.STYLES.header}
      >
        {isNeedHistoryBack && <span className="report-return" onClick={this.handleBackClick.bind(this)}>
          <i className="dmpicon-return"></i></span>}
        {urlArray.length > 0 && urlArray.map((item, i) => {
          if (i < urlArray.length - 1) {
            return (
              <span style={this.STYLES.title} key={`urlArray_${i}`}>
                <a onClick={ this.handleHrefClick.bind(this, item.url) } href="javascript:;"> {item.name}</a>
                <span style={{ width: '10px', margin: '0 7px', fontSize: '20px', verticalAlign: '-7%' }}>/</span>
              </span>
            )
          }
          return (
            <span style={{ ...this.STYLES.title, color: '#24BBF9' }} key={`urlArray_${i}`}>
              {item.name}
            </span>
          )
        })}
        {urlArray.length === 0 && <span style={this.STYLES.title}>{title}</span>}

        <ul className="dmp-full-screen-header-btns" style={this.STYLES.btns}>
          {isPage ? <li>
            <span style={{ marginRight: '6px' }}>切换时间</span>
            <Button className="btn-spin" style={{ marginRight: '6px' }} onClick={this.handleChangeValue.bind(this, -1)}>-</Button>
            <span className="time-value" style={{ marginRight: '6px' }}>{autoPlay.value}</span>
            <Button className="btn-spin" style={{ marginRight: '6px' }} onClick={this.handleChangeValue.bind(this, 1)}>+</Button>
            <Select
              value={autoPlay.unit}
              className="sm"
              style={{ width: '60px' }}
              onSelected={this.handleSelectUnit.bind(this)}
            >
              <option value={'S'}>秒</option>
              <option value={'M'}>分钟</option>
              <option value={'H'}>小时</option>
            </Select>
          </li> : null}
          {isPage ? <li>
            <IconButton
              isNavBar={true}
              iconClass={autoPlay.play ? 'dmpicon-stop2' : 'dmpicon-run'}
              onClick={this.handleTogglePlay.bind(this)}
            >
              {autoPlay.play ? '停止' : '播放'}
            </IconButton>
          </li> : null}
          {full ? <li>
            <IconButton
              isNavBar={true}
              iconClass='dmpicon-full'
              onClick={onHide}>
              退出全屏
            </IconButton>
          </li> :
            <li>
              <IconButton
                isNavBar={true}
                iconClass='dmpicon-full'
                onClick={onFull}>
                全屏
              </IconButton>
            </li>
          }
        </ul>
        {isPage ? <span className="side-btn left" onClick={this.handleChangePage.bind(this, false)}><i className="dmpicon-return" /></span> : null}
        {isPage ? <span className="side-btn right" onClick={this.handleChangePage.bind(this, true)}><i className="dmpicon-return reverse" /></span> : null}
      </div>
    );
  }

  handleHrefClick(url) {
    //console.log(url)
    this.context.router.replace(url)
  }
  
  handleBackClick() {
    const urlList = localStorage.getItem('urlList')
    const urlArray = urlList ? JSON.parse(urlList) : []
    if (urlArray.length > 1) {
      const url = urlArray[urlArray.length - 2]
      //console.log(url.url)
      this.context.router.replace(url.url)
    }
  }
  handleChangeValue(change) {
    this._updateAutoPlay({
      ...this.props.autoPlay,
      value: Math.max(this.props.autoPlay.value + change, 1)
    })
  }

  handleSelectUnit({ value }) {
    this._updateAutoPlay({
      ...this.props.autoPlay,
      unit: value
    })
  }

  handleTogglePlay() {
    this._updateAutoPlay({
      ...this.props.autoPlay,
      play: !this.props.autoPlay.play
    })
  }

  handleChangePage(next) {
    this.props.changePage(next)
  }

  _updateAutoPlay(autoPlay) {
    const { updateAutoPlay } = this.props
    if (updateAutoPlay) {
      updateAutoPlay(autoPlay)
    }
  }

  STYLES = {
    header: {
      textAlign: 'left',
      lineHeight: '50px',
      paddingLeft: '30px',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      transition: 'all .3s',
      zIndex: 1003
    },
    title: {
      height: '20px',
      lineHeight: '20px',
      fontSize: '18px'
    },
    btns: {
      float: 'right',
      paddingRight: '20px',
    }
  };
}

export default FullScreenHeader
