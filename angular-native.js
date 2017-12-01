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
     * 网络
     * @type {Http}
     */
    window.iHttp = new Http();

    /**
     * 工具
     * @type {Util}
     */
    window.iUtil = new Util();

    /**
     * 日期
     * @type {Moment}
     */
    window.iMoment = new Moment();

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
            ROUTE_ACTIONS: ['add', 'edit', 'detail', 'list'], // 路由注册行为
            ROUTE_ACTIONS_OPTIONS: { // 路由注册行为配置
                add: {html: 'edit'}, edit: {}, detail: {html: 'edit'}, list: {}
            }
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
                    resolve: suitableOptions(opts, 'transformResolve')(opts)
                    // opts.transformResolve(opts)
                };
            },
            transformActions: function (options) {
                return iUtil.adder(options.actions, options.actionsAdder);
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
                var params = suitableOptions(options, 'params') || [];
                var url = '/' + options.action;
                switch (options.action) {
                    case 'edit':
                        url += '/:id';
                }
                for (var i in params) {
                    var param = params[i];
                    url += '/:' + param;
                }
                return url;
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
                options.resolve = options.resolve || {};
                var actionOptions = options.actionOptions;
                var loads = [router.template(options.templateController, options)];
                if (options.loads) loads = loads.concat(options.loads);
                if (actionOptions && actionOptions.loads) loads = loads.concat(actionOptions.loads);
                var deps = suitableOptions(options, 'deps') || ['$ocLazyLoad', 'uiLoad', function ($ocLazyLoad, uiLoad) {
                    return $ocLazyLoad.load(loads);
                }];
                return {
                    module: function () {
                        return {
                            name: options.module,
                            action: options.action
                        }
                    },
                    deps: deps
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
            if (ng.isString(options)) options = {module: options};
            var opts = ng.extend(this.defaultOptions(), options);
            if (!opts.provider) console.error(('{provider:$stateProvider} is null'));
            var actions = opts.transformActions(opts);
            if (opts.abstract) this.abstractState(opts);
            for (var i in actions) {
                var action = actions[i];
                var actionOpts = ng.extend({action: action, actionOptions: opts[action]}, opts);
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
            if (ng.isDefined(console) && ng.isDefined(console.group) && ng.isDefined(console.debug)) {
                console.group('注册状态:' + state);
                console.debug(opts);
                console.groupEnd();
            }
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

        /**
         * 获取最适合的配置项
         * @param name 配置名称
         * @param options 全部配置项
         * @returns {*}
         */
        function suitableOptions(options, name) {
            var actionOptions = options.actionOptions;
            if (actionOptions && actionOptions[name])
                return actionOptions[name];
            return options[name];
        }
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

    /**
     * 网络
     * @constructor
     */
    function Http() {

        this.request = request;

        this.contentType = contentType;

        function request(entry) {
            return new Request(entry || 'request');
        }

        function contentType(entry) {
            return request(entry || 'headers').contentType();
        }
    }

    /**
     * 请求头
     * @constructor
     */
    function Request(entry) {
        var request = this;
        this.entry = entry || 'request';
        this.headers = [];

        this.contentType = contentType;

        function contentType(value) {
            if (!value) return;
            var name = 'Content-Type';
            switch (value) {
                case 'json':
                    request.headers.push(name, 'application/json');
                    break;
                case 'form':
                    request.headers.push(name, 'application/x-www-form-urlencoded');
                    break;
                case 'form-data':
                    request.headers.push(name, 'multipart/form-data');
                    break;
                default:
                    request.headers.push(name, value);
                    break;
            }
            return request.headers;
        }
    }

    /**
     * 工具
     * @constructor
     */
    function Util() {
        var util = this;
        // 日期格式化 moment.js
        this.FORMAT_MOMENT_MINUTE = 'YYYY-MM-DD HH:mm'; // 分
        // 并入
        this.adder = adder;
        // 驼峰命名
        this.camelCase = camelCase;
        // 包含
        this.contains = contains;
        // 开头
        this.startsWith = startsWith;
        // 查找对象
        this.findObject = findObject;
        // 首字母大写
        this.upperCaseFirst = upperCaseFirst;

        /**
         * 增加
         */
        function adder(source, target) {
            source = source || [];
            target = target || [];
            return source.concat(target);
        }

        /**
         * 驼峰命名
         */
        function camelCase(s, token) {
            token = /[-_]/ || token;
            if (contains(s, token)) {
                var string = '';
                var splits = s.split(token);
                for (var i in splits) {
                    var split = splits[i];
                    string += util.camelCase(split, token);
                }
                return string;
            }
            return upperCaseFirst(s);
        }

        /**
         * 包含
         */
        function contains(s, token) {
            return s.indexOf(token) !== -1;
        }

        function findObject(objectOrArray, value, name) {
            var key = 'value' || name;
            for (var i in objectOrArray) {
                var o = objectOrArray[i];
                if (o[key] === value) return o;
            }
            return null;
        }

        /**
         * 判断是否以token开头
         * @param s
         * @param token
         * @returns {boolean}
         */
        function startsWith(s, token) {
            return s.indexOf(token) === 0;
        }

        /**
         * 首字母大写
         */
        function upperCaseFirst(s) {
            return s.substring(0, 1).toUpperCase() + s.substring(1, s.length);
        }
    }

    /**
     * 日期
     * @constructor
     */
    function Moment() {
        // 将moment修正为中国时间
        this.momentCN = momentCN;
        // 一周的开始(中国从周一开始)
        this.startOfWeekCN = startOfWeekCN;
        // 一周的结束(中国在周日结束)
        this.endOfWeekCN = endOfWeekCN;

        /**
         * 将moment修正为中国时间
         * @param moment moment.js
         */
        function momentCN(moment) {
            var zone = moment.zone();
            if (zone !== -480) {
                return moment.subtract(zone + 480, 'minutes').zone(-8);
            }
            return moment.zone(-8);
        }

        /**
         * 一周的开始(中国从周一开始)
         */
        function startOfWeekCN(moment) {
            return moment.startOf('week').add(1, 'days');
        }

        /**
         * 一周的结束(中国在周日结束)
         */
        function endOfWeekCN(moment) {
            return moment.endOf('week').add(1, 'days');
        }

    }
})(window.angular, window.APPLICATION_CONFIG);