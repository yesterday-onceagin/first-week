import { baseAlias } from '../config';
import { redirect } from '../helpers/loginAuth'
import { isMobile } from '../helpers/common'

/**
 * root router
 */
export default {
  path: baseAlias || '/',
  component: isMobile() ? require('../views/layouts/MainMobile').default : require('../views/layouts/Main').default,
  indexRoute: {
    component: require('../views/login/login').default,
    onEnter: redirect(`${baseAlias}/login`)
  },
  childRoutes: [
    require('./login'),
    require('./home'),
    require('./datasource'),
    require('./new_dataset'),
    require('./dataclean'),
    require('./indicator'),
    require('./idconfig'),
    require('./label'),
    require('./dataview'),
    require('./app_menu'),
    require('./flow'),
    require('./organization'),
    require('./authority'),
    require('./app'),
    require('./change_password'),
    require('./feeds'),
    require('./norights'),
    require('./nolicense'),
    require('./404')
  ]
};
