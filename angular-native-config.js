window.APPLICATION_CONFIG = {
    MAIN_MODULE: 'app', // Angular主模块名称
    WELCOME_STATE: 'system.user.list', // 欢迎页
    ROUTER_STATE_PREFIX: 'app', // 路由状态前缀
    ROUTER_TEMPLATE_RESOURCE: 'app/{module}', // 路由资源模板
    ROUTER_TEMPLATE_ABSTRACT_STATE: '{statePrefix}.{module}', // 路由抽象状态模板
    ROUTER_TEMPLATE_STATE: '{statePrefix}.{module}.{action}', // 路由状态模板
    ROUTER_TEMPLATE_HTML: '{resource}/{module}-{action}.html', // 路由状态模板
    ROUTER_TEMPLATE_SERVICE: '{resource}/{module}-service.js', // 路由服务模板
    ROUTER_TEMPLATE_CONTROLLER: '{resource}/{module}-{action}.js', // 路由控制器模板
    ROUTER_TEMPLATE_CONTROLLER_NAME: '{module}.{action}.ctrl', // 路由控制器名称模板
    ROUTE_ACTIONS: ['add', 'edit', 'list'] // 路由注册行为
};