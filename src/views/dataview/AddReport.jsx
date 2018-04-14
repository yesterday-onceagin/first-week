import PropTypes from 'prop-types';
import React from 'react';
import reactMixin from 'react-mixin';

import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import FixedTopNav from '../../components/FixedTopNav';
import ReportNameDialog from './components/ReportNameDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewAddReportActionCreators } from '../../redux/modules/dataview/addReport';
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'

import _ from 'lodash';
import TipMixin from '@helpers/TipMixin';

import { baseAlias } from '../../config';

import './add-report.less';

class DataViewAddReport extends React.Component {
  static propTypes = {
    onChangeLayoutVisibility: PropTypes.func,
    params: PropTypes.object,
    actions: PropTypes.object,
    pending: PropTypes.bool,
    moduleList: PropTypes.array
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props)
    this.state = {
      active: 0,
      reportDialog: false
    }
  }

  componentWillMount() {
    // 组件将挂载时 通知main显示navBar的搜索框
    const { onChangeLayoutVisibility } = this.props

    // 布局的隐藏
    onChangeLayoutVisibility({
      hidePageHeader: true,  // 头部
      hideSideMenu: true     // 左侧菜单
    })
  }

  componentDidMount() {
    // 拉取 模版列表
    this.props.actions.fetchModulesData()
    // 重置窗口
    // window.onresize = _.debounce(this._adapteImage, 200)
  }

  componentDidUpdate() {
    // this._adapteImage()
  }

  render() {
    const { active, reportDialog } = this.state
    const { pending, moduleList } = this.props

    const selectItem = moduleList.length > 0 ? moduleList[active] : {}
    const selectPath = selectItem.cover || ''

    return (
      <div className="modules-page-container">
        <FixedTopNav onBack={this.handleBack.bind(this)}>
          <div style={this.STYLE_SHEET.top_nav}>选择模板</div>
        </FixedTopNav>
        <div className="add-report-page" style={this.STYLE_SHEET.page_view}>
          <ul style={this.STYLE_SHEET.left_side} id="module-list">
            {
              moduleList.map((item, index) => {
                // 选中模板
                const classes = active === index ? 'active' : ''
                const { layout, id, name, platform, cover } = item
                let ratio
                let width
                let height
                try {
                  const layoutObj = JSON.parse(layout);
                  ({ ratio, width, height } = layoutObj);
                } catch (error) {
                  ratio = ''
                  width = ''
                  height = ''
                }
                // 移动端标识
                const mobileIcon = <p><i className="dmpicon-mobile"/>移动端</p>
                // 封面信息
                const coverItem = cover ? (
                  <img src={`${cover}?x-oss-process=image/resize,m_mfit,h_80,w_120/crop,h_80,w_120`} />
                ) : null
                // 尺寸
                const ratioItem = ratio && <p>{`比例：${ratio}`}</p>

                return (
                  <li key={id} className={classes} onClick={this.handleSelectModule.bind(this, index)}>
                    <div className="image">
                      {coverItem}
                    </div>
                    <div className="context">
                      <div className="title">{name}</div>
                      <div className="des">
                        {platform === 'mobile' ? mobileIcon : ratioItem}
                        {width && height && <p>{`${width}x${height}`}</p>}
                      </div>
                    </div>
                  </li>
                )
              })
            }
            <li className="update-tips">
              <i className="dmpicon-refresh2" />
              <span>模版持续新增中</span>
            </li>
            <Loading containerId="module-list" pending={pending} />
          </ul>
          <div style={this.STYLE_SHEET.main_view}>
            <div className="main-view">
              <div className="image-wrap" ref={(node) => { this.visibleView = node }} style={{
                backgroundImage: `url(${selectPath})` || 'none'
              }}>
                {/* {selectPath && <img src={selectPath} ref={(node) => { this.target = node }} />} */}
                <div className="btn-mask">
                  <Button bsStyle="primary" onClick={this.hanldeCreate.bind(this)}>创建</Button>
                </div>
              </div>
              <div className="context">
                {selectItem ? selectItem.description : ''}
                <Button bsStyle="primary" bsSize="small" onClick={this.hanldeCreate.bind(this)}>创建</Button>
              </div>
            </div>
          </div>
        </div>
        <ReportNameDialog
          show={reportDialog}
          isEmptyTpl={active === 0}
          onClose={this.handleCloseDialog.bind(this)}
          onSure={this.handleSureDialog.bind(this)}
        />
      </div>
    )
  }

  handleSelectModule(active) {
    if (active !== this.state.active) {
      this.setState({
        active
      })
    }
  }

  handleBack() {
    const suffix = this.props.params.folderId ? this.props.params.folderId : 'index'
    this.context.router.push(`${baseAlias}/dataview/${suffix}`);
  }

  // 创建报告弹窗
  hanldeCreate() {
    this.setState({
      reportDialog: true
    })
  }

  handleCloseDialog() {
    this.setState({
      reportDialog: false
    })
  }

  // 确定弹窗，并且创建报告
  handleSureDialog(name, platform, callback) {
    const { active } = this.state
    const { params, actions, moduleList } = this.props
    // 定义基本参数
    let _params = {
      name,
      platform,
      type: 'FILE',
      parent_id: params.folderId || ''
    }
    // 如果选择了模板
    if (active > 0) {
      const selectItem = moduleList[active]
      _params = {
        name,
        id: selectItem.id,
        parent_id: params.folderId || ''
      }
    }
    // 发送请求进行报告创建
    actions.saveReportItem(_params, (json) => {
      if (json.result) {
        this.setState({
          reportDialog: false
        })
        // 提示
        this.showSucc('创建报告成功!')
        actions.clearDataset()
        // 跳转到报告设计页面
        const suffix = params.folderId || 'index'
        const url = `${baseAlias}/dataview/report/${suffix}/${json.data}/${name}`

        setTimeout(() => {
          this.context.router.push(url)
        }, 100)
      } else {
        this.setState({
          reportDialog: true
        })
        this.showErr(json.msg || '创建报告失败', 5000)
      }
      typeof callback === 'function' && callback()
    })
  }

  // 让图片在可视区域范围内自适应
  // _adapteImage = () => {
  //   const { active } = this.state
  //   const { moduleList } = this.props
  //   if (moduleList.length === 0 || active === 0) {
  //     return
  //   }
  //   const activeItem = moduleList[active]
  //   const activeItemLayout = activeItem && activeItem.layout ? JSON.parse(activeItem.layout) : null
  //   const $visibleView = $(this.visibleView)
  //   const $target = $(this.target)
  //   // 真实尺寸
  //   const realSize = {
  //     width: activeItemLayout ? +activeItemLayout.width : 0,
  //     height: activeItemLayout ? +activeItemLayout.height : 0
  //   }
  //   // 可视范围
  //   const visibleSize = {
  //     width: $visibleView.width(),
  //     height: $visibleView.height()
  //   }
  //   // 真实尺寸有 2方在 可视范围。真实大小
  //   // 1方在可视范围。 则
  //   // 没有在可视范围。 缩放
  //   if (visibleSize.width > realSize.width && visibleSize.height > realSize.height) {
  //     $target.width(realSize.width).height(realSize.height)
  //   } else if (visibleSize.width > realSize.width || visibleSize.height > realSize.height) {
  //     // 如果 宽度在可视范围内。则设置高度为 100 %
  //     if (visibleSize.width > realSize.width) {
  //       $target.height('100%').width('auto');
  //     } else {
  //       $target.width('100%').height('auto');
  //     }
  //   } else {
  //     const scale = {
  //       width: realSize.width / visibleSize.width,
  //       height: realSize.height / visibleSize.height
  //     }

  //     // 如果 宽度的缩放比例 大于 高度
  //     if (scale.width > scale.height) {
  //       $target.width('100%').height('auto');
  //     } else {
  //       $target.height('100%').width('auto');
  //     }
  //   }
  // };

  showErr(msg, timeout) {
    this.showTip({
      status: 'error',
      content: msg,
      timeout: timeout || 3000
    })
  }

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }

  STYLE_SHEET = {
    top_nav: {
      position: 'absolute',
      top: 0,
      left: 0,
      lineHeight: '50px',
      textAlign: 'center',
      width: '100%',
      fontSize: '16px'
    },
    page_view: {
      display: 'flex',
      flex: 1
    },
    left_side: {
      width: '300px',
      background: '#141E39',
      overflow: 'auto'
    },
    main_view: {
      display: 'flex',
      flex: 1
    }
  }
}

reactMixin.onClass(DataViewAddReport, TipMixin)

const stateToProps = state => ({
  ...state.dataViewAddReport
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewAddReportActionCreators, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataViewAddReport);

