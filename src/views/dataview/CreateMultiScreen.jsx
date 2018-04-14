import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'
import Sortable from 'react-sortablejs'
import Button from 'react-bootstrap-myui/lib/Button'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import FixedTopNav from '../../components/FixedTopNav'
import IconButton from '../../components/IconButton'
import { Form, ValidatedInput } from '../../components/bootstrap-validation'
import MultiScreenSelect from './components/MultiScreenSelect'

import { actions as dataViewListActionCreators } from '../../redux/modules/dataview/list';
import { actions as dataViewMultiScreenActionCreators } from '../../redux/modules/dataview/multiScreen';
import { baseAlias } from '../../config'
import TipMixin from '../../helpers/TipMixin'
import getApiPath from '../../helpers/getApiPath'

import { convertFolderTree } from './utils/treeDataHelper'

import './create-multiscreen.less'

function mockScreens(screens) {
  return screens.map(screen => ({
    ...screen,
    description: screen.description || screen.name,
    cover: screen.cover || ''
  }))
}

const ScreenList = props => (
  <div className="screen-list-wrap">
    <Sortable tag="ul"
      className="screen-list-inner"
      options={{ sort: true, group: { name: 'screens' } }}
      onChange={props.onSortScreen}
    >
      {
        props.screens && props.screens.map(screen => (
          <li
            key={screen.id}
            data-id={screen.id}
            className={screen.id === props.activeScreen.id ? 'active' : ''}
            onClick={() => props.onClickScreen(screen)}>
            {screen.cover ? <img src={screen.cover} /> : <div className="img"></div>}
          </li>
        ))
      }
    </Sortable>
    <div className="import-screen" onClick={e => props.onAddScreen(e)}>
      <span className="horizontal-line"></span>
      <span className="vertical-line"></span>
    </div>
  </div>
)

ScreenList.propTypes = {
  activeScreen: PropTypes.object,
  onSortScreen: PropTypes.func,
  onAddScreen: PropTypes.func,
  screens: PropTypes.array
}

class CreateMultiScreen extends React.Component {
  static propTypes = {
    onChangeLayoutVisibility: PropTypes.func,
    actions: PropTypes.object,
    params: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      info: {
        name: '',
        description: ''
      },
      screens: [],
      activeScreen: {},
      showScreenSelect: false,
      reportTreeList: []
    }

    // 中间区域的各边padding
    this.paddingTop = 50
    this.paddingBottom = 150
    this.paddingSide = 50
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { onChangeLayoutVisibility } = this.props

    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
  }

  componentDidMount() {
    this.fetchReportTreeList()

    if (this.props.params.screenId) {
      this.fetchMultiScreenDetail()
    }
  }

  render() {
    const { info, screens, activeScreen, showScreenSelect, reportTreeList } = this.state
    const paddingStyleStr = `${this.paddingTop}px ${this.paddingSide}px ${this.paddingBottom}px`
    const imgHeight = window.innerHeight - this.paddingTop - this.paddingBottom - 50
    const imgWidth = window.innerWidth - this.paddingSide - this.paddingSide - 160 - 240

    return (
      <div className="multi-screen-container">
        <FixedTopNav onBack={this.handleBack}>
          <h3 className="nav-title">{this.props.params.screenId ? '编辑多屏' : '创建多屏'}</h3>
          <IconButton
            onClick={() => this.multi_screen_form.submit()}
            className='fixed green'
            iconClass='dmpicon-save'
            style={{ margin: '13px 30px 13px 0', float: 'right' }}>
            保存
          </IconButton>

          <IconButton
            onClick={this.handlePreviewSave.bind(this)}
            className='fixed green'
            iconClass='dmpicon-full'
            style={{ margin: '13px 17px 13px 0', float: 'right' }}>
            预览
          </IconButton>
        </FixedTopNav>

        <div className="screen-list">
          <ScreenList
            screens={screens}
            activeScreen={activeScreen}
            onAddScreen={this.onAddScreen}
            onClickScreen={this.onClickScreen}
            onSortScreen={this.onSortScreen}>
          </ScreenList>
        </div>

        <div className="multi-screen-info">
          <Form validationEvent="onBlur"
            onValidSubmit={this.handleValidSubmit}
            ref={(c) => { this.multi_screen_form = c }}>

            <ValidatedInput type="text"
              label={<span><i className="required">*</i>大屏名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              wrapperClassName="input-wrapper"
              maxLength="15"
              validate='required'
              errorHelp={{
                required: '请输入大屏名称'
              }} />

            <ValidatedInput type="textarea"
              label={<span><i className="required">&nbsp;</i>备注</span>}
              autoComplete="off"
              name="description"
              value={info.description || ''}
              onChange={this.handleChangeInfo.bind(this, 'description')}
              wrapperClassName="input-wrapper" />
          </Form>
        </div>

        {
          Object.keys(activeScreen).length > 0 ? (
            <div className="screen-view">
              <div className="screen-view-inner" style={{ padding: paddingStyleStr }}>
                {
                  activeScreen.cover ? (
                    <img src={`${activeScreen.cover}?x-oss-process=image/resize,m_pad,h_${imgHeight},w_${imgWidth},color_141E39`} />
                  ) : (
                    <div className="img" />
                  )
                }
                <div className="remark-wrap">
                  <div className="btn-del">
                    <Button bsStyle="primary" bsSize="small" onClick={this.removeActiveScreen.bind(this)}>删除</Button>
                  </div>
                  <div className="remark">{activeScreen.description}</div>
                </div>
              </div>
            </div>
          ) : null
        }

        <MultiScreenSelect
          show={showScreenSelect}
          dataSetTree={reportTreeList}
          defaultScreens={screens}
          onClose={this.onCloseScreenSelect}
          onSelect={this.onScreenSelect.bind(this)}>
        </MultiScreenSelect>
      </div>
    )
  }

  hanleActiveScreen(screens) {
    if (screens.length === 0) {
      return {}
    }

    const { activeScreen } = this.state
    const hasActiveScreen = Object.keys(activeScreen).length !== 0
    if (!hasActiveScreen || (hasActiveScreen && !screens.find(screen => screen.id === activeScreen.id))) {
      return mockScreens(screens)[0] || {}
    }
    return activeScreen
  }

  removeActiveScreen() {
    this.setState(prevState => ({
      screens: prevState.screens.filter(screen => screen.id !== prevState.activeScreen.id),
      activeScreen: {}
    }), () => {
      this.setState({
        activeScreen: this.hanleActiveScreen(this.state.screens)
      })
    })
  }

  fetchReportTreeList() {
    // 仅获取PC端报告 多屏不适用于移动端
    this.props.actions.fetchDataviewList({
      exclude_platforms: 'mobile'
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '获取报告列表失败');
      } else {
        const { tree } = json.data
        this.setState({
          reportTreeList: tree ? convertFolderTree(tree, false) : []
        })
      }
    })
  }

  fetchMultiScreenDetail() {
    const { params, actions } = this.props
    actions.fetchMultiScreenDetail({ id: params.screenId }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '获取多屏详情失败');
      } else {
        const { dashboard, screens } = json.data
        this.setState({
          info: {
            name: dashboard.name,
            description: dashboard.description
          },
          screens: mockScreens(screens) || [],
          activeScreen: this.hanleActiveScreen(screens)
        })
      }
    })
  }

  handleBack = () => {
    this.context.router.push(`${baseAlias}/dataview/index?type=多屏管理`)
  };

  onAddScreen = () => {
    this.setState({
      showScreenSelect: true
    })
  };

  onCloseScreenSelect = () => {
    this.setState({
      showScreenSelect: false
    })
  };

  onScreenSelect(screens) {
    this.setState({
      showScreenSelect: false,
      screens: mockScreens(screens),
      activeScreen: this.hanleActiveScreen(screens)
    })
  }

  onClickScreen = (screen) => {
    this.setState({
      activeScreen: screen
    })
  };

  onSortScreen = (orderItemIds) => {
    const orderScreens = orderItemIds.map(itemid => this.state.screens.find(screen => screen.id === itemid))
    this.setState(() => ({
      screens: orderScreens,
      activeScreen: this.hanleActiveScreen(orderScreens)
    }))
  };

  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  }

  handlePreviewSave() {
    this.isPreparePreview = true
    this.multi_screen_form.submit()
  }

  handleValidSubmit = () => {
    const { info, screens } = this.state
    // const { actions } = this.props
    if (screens.length < 1) {
      return this.showErr('请至少选择一个报告')
    }

    const sendParams = {
      id: this.props.params.screenId || this.currScreenId || '',
      name: info.name,
      description: info.description,
      screens: screens.map(screen => screen.id)
    }

    // actions.saveMutilScreen(sendParams, (json) => {
    //   if (!json.result) {
    //     this.showErr(json.msg || '保存失败');
    //     this.isPreparePreview = false
    //   } else {
    //     this.showSucc('保存成功');
    //     this.currScreenId = json.data

    //     if (this.isPreparePreview) {
    //       this.isPreparePreview = false
    //       const path = `${baseAlias}/dataview/preview/${json.data}`
    //       // 避免拦截
    //       if ($('#_downloadWin').length > 0) {
    //         $('#_downloadWin').attr('action', path);
    //       } else {
    //         $('body').append($(`<form id="_downloadWin" action="${path}" method="get" target="_blank"></form>`));
    //       }
    //       $('#_downloadWin').submit();
    //     } else {
    //       this.handleBack()
    //     }
    //   }
    // })

    // 改用同步请求处理弹窗
    const json = $.ajax({
      url: getApiPath('dashboard/screen/save'),
      async: false,
      data: JSON.stringify(sendParams),
      type: 'POST',
      dataType: 'json',
      headers: {
        'Content-Type': 'application/json'
      },
      xhrFields: {
        withCredentials: true
      },
    }).responseJSON

    if (json && json.result) {
      this.showSucc('保存成功');
      this.currScreenId = json.data
      if (this.isPreparePreview) {
        this.isPreparePreview = false
        const path = `${baseAlias}/dataview/preview/${json.data}`
        window.open(path, '_blank')
      } else {
        this.handleBack()
      }
    } else {
      this.showErr(json.msg || '保存失败');
      this.isPreparePreview = false
    }
  };

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }
}

reactMixin.onClass(CreateMultiScreen, TipMixin)

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewListActionCreators, dataViewMultiScreenActionCreators), dispatch)
})

export default connect(null, dispatchToProps)(CreateMultiScreen)
