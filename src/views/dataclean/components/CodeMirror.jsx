const PropTypes = require('prop-types');
const React = require('react');
const createReactClass = require('create-react-class');

const className = require('classnames');
const debounce = require('lodash.debounce');
const codemirror = require('rt-codemirror');

//配置开启 hint  加载 mycodemirror
require('rt-codemirror/addon/hint/show-hint.js');
//code样式
require('rt-codemirror/lib/codemirror.css');
require('rt-codemirror/addon/hint/show-hint.css');
// 加载主题
require('rt-codemirror/theme/monokai.css');

const CodeMirror = createReactClass({
  displayName: 'CodeMirror',

  propTypes: {
    onChange: PropTypes.func,
    onFocusChange: PropTypes.func,
    onScroll: PropTypes.func,
    options: PropTypes.object,
    path: PropTypes.string,
    value: PropTypes.string,
    className: PropTypes.any,
    codeMirrorInstance: PropTypes.func,
  },

  getCodeMirrorInstance() {
    return this.props.codeMirrorInstance || codemirror;
  },

  getInitialState() {
    return {
      isFocused: false,
      timmer: null,
      hintTimmer: null,
      selectTimmer: null
    };
  },

  componentWillMount() {
    // 判断是否mac 回调到上一层函数
    const initFun = this.props.initFun;
    if (initFun) initFun(this.getCodeMirrorInstance());
  },

  componentDidMount() {
    // 获取props的值
    const { options, value, getCodeMirror } = this.props;
    const textareaNode = this.textarea
    const codeMirrorInstance = this.getCodeMirrorInstance();

    this.codeMirror = codeMirrorInstance.fromTextArea(textareaNode, options);
    // 注册
    this.codeMirror.on('change', this.codemirrorValueChanged);
    this.codeMirror.on('focus', this.focusChanged.bind(this, true));
    this.codeMirror.on('blur', this.focusChanged.bind(this, false));
    this.codeMirror.on('scroll', this.scrollChanged);
    this.codeMirror.on('cursorActivity', this.cursorActivity);

    this.codeMirror.setValue(value || '');
    // 首先设置hint值
    this.setHintModel();
    // 将当前的codeMirror 对象通过回调传递给子组件
    getCodeMirror && getCodeMirror(this.codeMirror);
  },

  compontWillUmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
    this.state.timmer && clearTimeout(this.state.timmer);
    this.state.hintTimmer && clearTimeout(this.state.hintTimmer);
  },

  shouldComponentUpdate() {
    return false;
  },

  componentWillReceiveProps: debounce(function (nextProps) {
    if (nextProps.keyModel || nextProps.tableModel || nextProps.funcModel) {
      // 首先设置hint值
      this.setHintModel();
    }
    if (typeof nextProps.options === 'object') {
      Object.getOwnPropertyNames(nextProps.options).forEach((optionName) => {
        this.codeMirror.setOption(optionName, nextProps.options[optionName]);
      });
    }
  }, 0),

  getCodeMirror() {
    return this.codeMirror;
  },

  focus() {
    if (this.codeMirror) {
      this.codeMirror.focus();
    }
  },

  focusChanged(focused) {
    this.setState({
      isFocused: focused,
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  },

  scrollChanged(cm) {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  },

  cursorActivity(cm) {
    //用户做任何的操作的时候 执行
    const callback = this.props.onSelect;
    //设置selection
    if (!callback) return;
    //判断如果有 getSelection(); 则callbackselection
    const selectVal = cm.getSelection();
    this.state.selectTimmer && clearTimeout(this.state.selectTimmer);
    this.state.selectTimmer = setTimeout(() => {
      callback(selectVal);
    }, 50);
  },

  codemirrorValueChanged(doc, change) {
    const value = doc.getValue();
    if (this.props.onChange && change.origin !== 'setValue') {
      this.state.timmer && clearTimeout(this.state.timmer);
      this.state.timmer = setTimeout(() => {
        this.props.onChange(value);
      }, 100)
    }
    //更改code输入框 判断是否提示 增加和删除的时候 使用它settimeout 避免循环调用 setvalue时间 导致错误
    this.state.hintTimmer && clearTimeout(this.state.hintTimmer);
    this.state.hintTimmer = setTimeout(() => {
      const text = change.text[0];
      //输入和删除的时候才开启 判断当前的值是否为空 是的话不提示
      if (change.origin === '+delete') {
        //如果是删除的话 判断他的前面一个是不是空格
        this.codeMirror.showHint();
        return;
      }
      //提示的情况
      //1   删除的时候提示
      //2   origin为输入的时候  前面字符为;\n \r , ;  的时候不提示
      if (text === ';' || text === ',' || text === '\n' || text === '\r') {
        return;
      }

      //其他的行为 输入的操作
      if (change.origin === '+input') {
        this.codeMirror.showHint();
      }
    }, 50);
  },

  setHintModel() {
    const codeMirrorInstance = this.getCodeMirrorInstance();
    const mode = codeMirrorInstance.mimeModes[this.props.options.mode];
    const {
      keyModel,
      tableModel,
      funcModel
    } = this.props;
    if (mode) {
      mode.keys = keyModel;
      mode.tables = tableModel;
      mode.functions = funcModel;
    }
  },

  render() {
    const editorClassName = className(
      'ReactCodeMirror',
      this.state.isFocused ? 'ReactCodeMirror--focused' : null,
      this.props.className
    );
    const styles = Object.assign(this.props.style || {}, {
      fontFamily: "'Liberation Mono', Consolas, Menlo, Courier, monospace",
      fontSize: '12px'
    });
    return (
      <div className={editorClassName} style={styles}>
        <textarea ref={(node) => { this.textarea = node }} name={this.props.path} defaultValue={this.props.value} autoComplete="off" />
      </div>
    );
  },
});

export default CodeMirror;
