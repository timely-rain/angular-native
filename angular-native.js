/**
 * 原生JS模块及工具
 *
 * @author timely-rain
 * @verion 1.0.0, 2017/9/28
 * @since ECMAScript5
 */
(function (ng, CONFIG) {
    'use strict';
    /**
     * 配置
     * @type {Config}
     */
    window.iConfig = new Config(CONFIG);

    /**
     * 模块
     * @type {Module}
     */
    window.iModule = new Module();

    /**
     * 路由
     * @type {Router}
     */
    window.iRouter = new Router();

    /**
     * 路径
     * @type {Path}
     */
    window.iPath = new Path();

    /**
     * 应用
     * @type {Application}
     */
    window.iApp = new Application();

    /**
     * 配置
     * @constructor
     */
    function Config(settings) {
        var config = this;
        this.config = function (settings) {
            ng.extend(config, settings);
        };
        this.config({
            MAIN_MODULE: 'app', // Angular主模块名称
            WELCOME_STATE: '', // 欢迎页
            ROUTER_PROVIDER: null, // 路由提供者
            ROUTER_STATE_PREFIX: 'app', // 路由状态前缀
            ROUTER_TEMPLATE_RESOURCE: 'app/modules/{module}', // 路由资源模板
            ROUTER_TEMPLATE_ABSTRACT_STATE: '{statePrefix}.{module}', // 路由抽象状态模板
            ROUTER_TEMPLATE_STATE: '{statePrefix}.{module}.{action}', // 路由状态模板
            ROUTER_TEMPLATE_HTML: '{resource}/{module}-{action}.html', // 路由状态模板
            ROUTER_TEMPLATE_SERVICE: '{resource}/{module}-service.js', // 路由服务模板
            ROUTER_TEMPLATE_CONTROLLER: '{resource}/{module}-{action}.js', // 路由控制器模板
            ROUTER_TEMPLATE_CONTROLLER_NAME: '{module}.{action}.ctrl', // 路由控制器名称模板
            ROUTER_TEMPLATE_CONTROLLER_ALIAS: 'vm', // 路由控制器别名
            ROUTE_ACTIONS: ['add', 'edit', 'list'] // 路由注册行为
        });
        settings && this.config(settings);
    }

    /**
     * 应用
     * @constructor
     */
    function Application() {
        this.module = iModule.get;
    }

    /**
     * 模块
     * @constructor
     */
    function Module() {
        this.get = function (name) {
            if (name)
                return ng.module(name);
            else
                return ng.module(iConfig.MAIN_MODULE);
        }
    }

    /**
     * 路由
     * @constructor
     */
    function Router() {
        var router = this;
        /**
         * 默认的
         * @type {[string,string,string]}
         */
        router.default = {
            /**
             * 默认抽象状态
             */
            transformAbstractState: function (options) {
                return router.template(options.templateAbstractState, options);
            },
            /**
             * 默认抽象状态配置
             */
            transformAbstractStateOptions: function (options) {
                return {
                    url: '/' + options.module,
                    template: '<div ui-view></div>',
                    resolve: {
                        deps: ['$ocLazyLoad',
                            function ($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    router.template(options.templateService, options)
                                ]);
                            }]
                    }
                };
            },
            /**
             * 默认状态
             */
            transformState: function (options) {
                return router.template(options.templateState, options);
            },
            /**
             * 默认状态配置
             */
            transformStateOptions: function (opts) {
                return {
                    url: opts.transformUrl(opts),
                    templateUrl: opts.transformTemplateUrl(opts),
                    controller: opts.transformControllerName(opts),
                    controllerAs: opts.transformControllerAlias(opts),
                    resolve: opts.transformResolve(opts)
                };
            },
            transformActions: function (options) {
                return options.actions;
            },
            /**
             * 默认行为
             * @param options
             */
            transformAction: function (options) {
                return options.action;
            },
            /**
             * 默认路径
             */
            transformUrl: function (options) {
                switch (options.action) {
                    case 'edit':
                        return '/' + options.action + '/:id';
                    default:
                        return '/' + options.action;
                }
            },
            /**
             * 默认模板路径
             * @param options
             */
            transformTemplateUrl: function (options) {
                return router.template(options.templateHtml, options);
            },
            /**
             * 默认控制器名称
             */
            transformControllerName: function (options) {
                return router.template(options.templateControllerName, options);
            },
            /**
             * 默认控制器别名
             */
            transformControllerAlias: function (options) {
                return options.templateControllerAlias;
            },
            /**
             * 默认预加载项
             */
            transformResolve: function (options) {
                return {
                    deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                router.template(options.templateController, options)
                            ]);
                        }]
                };
            }
        };
        /**
         * 默认配置
         * @type {Object}
         * @description
         * - abstract 是否创建抽象父状态
         * - provider 路由提供者
         * - statePrefix 状态前缀
         * - templateResource
         * - templateState
         * - templateHtml
         * - templateService
         * - templateController
         * - templateControllerName
         * - actions
         */
        router.defaultOptions = function () {
            return ng.extend({
                abstract: true,
                provider: iConfig.ROUTER_PROVIDER,
                statePrefix: iConfig.ROUTER_STATE_PREFIX,
                templateResource: iConfig.ROUTER_TEMPLATE_RESOURCE,
                templateAbstractState: iConfig.ROUTER_TEMPLATE_ABSTRACT_STATE,
                templateState: iConfig.ROUTER_TEMPLATE_STATE,
                templateHtml: iConfig.ROUTER_TEMPLATE_HTML,
                templateService: iConfig.ROUTER_TEMPLATE_SERVICE,
                templateController: iConfig.ROUTER_TEMPLATE_CONTROLLER,
                templateControllerName: iConfig.ROUTER_TEMPLATE_CONTROLLER_NAME,
                templateControllerAlias: iConfig.ROUTER_TEMPLATE_CONTROLLER_ALIAS,
                actions: iConfig.ROUTE_ACTIONS
            }, router.default);
        };
        /**
         * 注册模块(多个状态)
         * @param options
         */
        router.module = function (options) {
            var opts = ng.extend(this.defaultOptions(), options);
            if (!opts.provider) console.error(('{provider:$stateProvider} is null'));
            var actions = opts.transformActions(opts);
            if (opts.abstract) this.abstractState(opts);
            for (var i in actions) {
                var actionOpts = ng.extend({action: actions[i]}, opts);
                this.state(actionOpts);
            }
        };
        /**
         * 注册抽象状态
         * @param opts
         */
        router.abstractState = function (opts) {
            var state = opts.transformAbstractState(opts);
            var provider = opts.provider;
            var stateOptions = opts.transformAbstractStateOptions(opts);
            this.debugState(state, stateOptions);
            provider.state(state, stateOptions);
        };
        /**
         * 注册状态
         * @param opts
         */
        router.state = function (opts) {
            var state = opts.transformState(opts);
            var provider = opts.provider;
            var stateOptions = opts.transformStateOptions(opts);
            this.debugState(state, stateOptions);
            provider.state(state, stateOptions);
        };
        router.debugState = function (state, opts) {
            console.group('注册状态:' + state);
            console.debug(opts);
            console.groupEnd();
        };
        /**
         * 模板解析
         * @param template
         * @param opts
         */
        router.template = function (template, opts) {
            return template.replace(/{resource}/, opts.templateResource)
                .replace(/{statePrefix}/, opts.statePrefix)
                .replace(/{module}/g, opts.module)
                .replace(/{action}/, opts.action);
        };
        router.config = iConfig.config;
    }

    /**
     * 路径
     * @constructor
     */
    function Path() {
        this.get = function (options) {
            var opts = ng.extend({name: 'resource', url: '', prefix: ''}, options);
            switch (opts.name) {
                default:
                    return opts.url;
            }
        };
        /**
         * 资源路径
         * @param url
         */
        this.resource = function (url) {
            return this.get({url: url});
        };
        /**
         * 请求路径
         * @param url
         */
        this.api = function (url) {
            return this.get({name: 'api', url: url});
        };
    }
})(window.angular, window.APPLICATION_CONFIG);