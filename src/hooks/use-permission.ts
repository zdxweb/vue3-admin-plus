import NProgress from 'nprogress'
/**
 * 根据请求，过滤异步路由
 * @param:menuList 异步路由数组
 * return 过滤后的异步路由
 */
// @ts-ignore
import Layout from '@/layout/index.vue'
/*
 * 路由操作
 * */
import router, { asyncRoutes, constantRoutes, roleCodeRoutes } from '@/router'
//进度条
import 'nprogress/nprogress.css'
import { useBasicStore } from '@/store/basic'

const buttonCodes = [] //按钮权限
export const filterAsyncRoutesByMenuList = (menuList) => {
  const filterRouter = []
  menuList.forEach((route) => {
    //button permission
    if (route.category === 3) {
      buttonCodes.push(route.code)
    } else {
      //generator every router item by menuList
      const itemFromReqRouter = getRouteItemFromReqRouter(route)
      if (route.children?.length) {
        //judge  the type is router or button
        itemFromReqRouter.children = filterAsyncRoutesByMenuList(route.children)
      }
      filterRouter.push(itemFromReqRouter)
    }
  })
  return filterRouter
}
const getRouteItemFromReqRouter = (route) => {
  const tmp = { meta: { title: '' } }
  const routeKeyArr = ['path', 'component', 'redirect', 'alwaysShow', 'name', 'hidden']
  const metaKeyArr = ['title', 'activeMenu', 'elSvgIcon', 'icon']
  // @ts-ignore
  const modules = import.meta.glob('../views/**/**.vue')
  //generator routeKey
  routeKeyArr.forEach((fItem) => {
    if (fItem === 'component') {
      if (route[fItem] === 'Layout') {
        tmp[fItem] = Layout
      } else {
        //has error , i will fix it through plugins
        //tmp[fItem] = () => import(`@/views/permission-center/test/TestTableQuery.vue`)
        tmp[fItem] = modules[`../views/${route[fItem]}`]
      }
    } else if (fItem === 'path' && route.parentId === 0) {
      tmp[fItem] = `/${route[fItem]}`
    } else if (['hidden', 'alwaysShow'].includes(fItem)) {
      tmp[fItem] = !!route[fItem]
    } else if (['name'].includes(fItem)) {
      tmp[fItem] = route['code']
    } else if (route[fItem]) {
      tmp[fItem] = route[fItem]
    }
  })
  //generator metaKey
  metaKeyArr.forEach((fItem) => {
    if (route[fItem] && tmp.meta) tmp.meta[fItem] = route[fItem]
  })
  //route extra insert
  if (route.extra) {
    Object.entries(route.extra.parse(route.extra)).forEach(([key, value]) => {
      if (key === 'meta' && tmp.meta) {
        tmp.meta[key] = value
      } else {
        tmp[key] = value
      }
    })
  }
  return tmp
}

/**
 * 根据角色数组过滤异步路由
 * @param routes asyncRoutes 未过滤的异步路由
 * @param roles  角色数组
 * return 过滤后的异步路由
 */
export function filterAsyncRoutesByRoles(routes, roles) {
  const res = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutesByRoles(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
  return res
}
function hasPermission(roles, route) {
  if (route?.meta?.roles) {
    return roles?.some((role) => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * 根据code数组，过滤异步路由
 * @param codes code数组
 * @param codesRoutes 未过滤的异步路由
 * return 过滤后的异步路由
 */
export function filterAsyncRouterByCodes(codesRoutes, codes) {
  const filterRouter = []
  codesRoutes.forEach((routeItem) => {
    if (hasCodePermission(codes, routeItem)) {
      if (routeItem.children) routeItem.children = filterAsyncRouterByCodes(routeItem.children, codes)
      filterRouter.push(routeItem)
    }
  })
  return filterRouter
}
function hasCodePermission(codes, routeItem) {
  if (routeItem.meta?.code) {
    return codes.includes(routeItem.meta.code) || routeItem.hidden
  } else {
    return true
  }
}
//过滤异步路由
export function filterAsyncRouter(data) {
  const basicStore = useBasicStore()
  let accessRoutes = []
  // if (permissionMode === 'rbac') {
  //   accessRoutes = filterAsyncRoutesByMenuList(menuList) //by menuList
  // } else if (permissionMode === 'roles') {
  //   accessRoutes = filterAsyncRoutesByRoles(roleCodeRoutes, roles) //by roles
  // } else {
  //   accessRoutes = filterAsyncRouterByCodes(roleCodeRoutes, codes) //by codes
  // }
  const fileAfterRouter = filterAsyncRouterByReq(data)
  accessRoutes = [fileAfterRouter[0]]
  accessRoutes.forEach((route) => router.addRoute(route))
  console.log(accessRoutes)
  // asyncRoutes.forEach((item) => router.addRoute(item))
  basicStore.setFilterAsyncRoutes(accessRoutes)
}

import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/components/InnerLink/index.vue'
// 过滤请求的应用
export const filterAsyncRouterByReq = (asyncRouterMap, lastRouter = false, type = false) => {
  return asyncRouterMap.filter((route) => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = modules[`../views${route.component}`]
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouterByReq(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

const filterChildren = (childrenMap, lastRouter = false) => {
  let children = []
  childrenMap.forEach((el) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach((c) => {
          c.path = `${el.path}/${c.path}`
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter) {
      el.path = `${lastRouter.path}/${el.path}`
    }
    children = children.concat(el)
  })
  return children
}

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('../views/**/**.vue')
console.log(modules)
const loadView = (view) => {
  let res
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = () => modules[path]()
    }
  }
  return res
}

//重置路由
export function resetRouter() {
  //移除之前存在的路由
  const routeNameSet = new Set()
  router.getRoutes().forEach((fItem) => {
    if (fItem.name) routeNameSet.add(fItem.name)
  })
  routeNameSet.forEach((setItem) => router.removeRoute(setItem))
  //新增constantRoutes
  constantRoutes.forEach((feItem) => router.addRoute(feItem))
}
//重置登录状态
export function resetState() {
  resetRouter()
  useBasicStore().resetState()
}

//刷新路由
export function freshRouter(data) {
  resetRouter()
  filterAsyncRouter(data)
  // location.reload()
}

NProgress.configure({ showSpinner: false })
//开始进度条
export const progressStart = () => {
  NProgress.start()
}
//关闭进度条
export const progressClose = () => {
  NProgress.done()
}
