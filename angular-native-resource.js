(function (app, ng) {
    'use strict';

    /**
     * 注册供应商
     */
    app.provider('iResource', Provider);

    /**
     * 注册控制器
     */
    app.controller('iResourceController', Controller);

    /**
     * 控制器依赖
     */
    Controller.$inject = ['$scope', '$stateParams', 'dialogs', 'module', 'iResource'];

    /**
     * 供应商
     * @constructor
     */
    function Provider() {
        // 初始化
        var provider = this;

        // 属性声明
        this.defaults = {
            actions: {
                'update': {method: 'PUT'},
                'paging': {method: 'POST', url: 'paging'},
                'patch': {method: 'PATCH'}
            }
        };

        // 注册服务
        this.$get = ['$q', '$resource', constructor];

        // 声明服务
        function constructor($q, $resource) {
            return resourceFactory;

            /**
             * 资源工厂
             * @param url
             * @param paramDefaults
             * @param actions
             * @param options
             * @returns {*}
             */
            function resourceFactory(url, paramDefaults, actions, options) {
                // 解析配置
                if (ng.isObject(url)) {
                    options = url;
                    url = transformUrl(options);
                    paramDefaults = options.paramDefaults || {};
                    actions = options.actions || {};
                }
                actions = ng.extend({}, provider.defaults.actions, actions);
                resolveActions(actions);
                resolveOptions(options);
                // 初始化
                var resource = $resource(url, paramDefaults, actions, options);
                // 属性声明
                resource.promises = promises(resource);
                // 方法引用
                ng.extend(resource, {
                    defer: defer, // Promise机制
                    extend: extend, // 继承RESTful服务
                    isRestApi: isRestApi // 判断是否RESTful接口
                });
                return resource;
            }

            /**
             * 解析Action, 处理简化后的语法
             * @param actions
             */
            function resolveActions(actions) {
                for (var i in actions) {
                    var action = actions[i];
                    action.headers = iHttp.contentType();
                }
            }

            /**
             * 解析Options
             * @param options
             */
            function resolveOptions(options) {
                if (!options) return;
                var module = options.module;
                if (options.module) {
                    provider.defaults.actions.paging.url = module.name + '/paging';
                }
            }

            /**
             * 获取请求的Promise对象
             * @param request 请求
             * @param data 数据
             * @returns {*|Promise|promise}
             */
            function defer(request, data) {
                var defer = $q.defer();
                request && request(data, function (data/*,headers*/) {
                    defer.resolve(data);
                }, function (data/*,headers*/) {
                    defer.reject(data);
                });
                return defer.promise;
            }

            // 继承RESTful服务
            function extend(service, options) {
                var resource = resourceFactory(options);
                ng.extend(service, resource);
            }

            /**
             * 判断是否RESTful接口
             * @param request 请求
             * @returns {boolean} 是否RESTful接口
             */
            function isRestApi(request) {
                if (ng.isFunction(request)) {
                    var constructor = request.prototype.constructor;
                    return (ng.isUndefined(constructor.name)/*兼容IE*/ || constructor.name === '' ) // $resource的RESTful接口是匿名方法
                        && constructor.length === 4; // $resource的RESTful接口有4个参数
                }
                return request;
            }

            /**
             * 生成全部请求的Promise对象
             * @param resource
             * @returns {{}}
             */
            function promises(resource) {
                var promises = {};
                for (var name in resource) {
                    var request = resource[name];
                    if (isRestApi(request))
                        promises[name] = new RequestCache(name, request).get();
                }
                return promises;
            }

            /**
             * 请求缓存(解决循环索引问题)
             * @param name
             * @param request
             * @constructor
             */
            function RequestCache(name, request) {
                var cache = this;
                this.name = name;
                this.request = request;
                this.get = function () {
                    return function (data) {
                        data = data || {};
                        return defer(cache.request, data)
                    }
                }
            }

            /**
             * 请求路径
             * @param options
             * @returns {string}
             */
            function transformUrl(options) {
                if (options.url) return options.url;
                var module = options.module;
                var id = module.id || 'id';
                if (module && module.name)
                    return module.name + '/:' + id;
                console.error('Init iResource Error!');
            }
        }
    }

    /**
     * 控制器
     * @constructor
     */
    function Controller($scope, $stateParams, dialogs, module, Service) {
        var vm = this;
        resolveAction(); // 解析Action

        this.model = {}; // 数据模型
        this.models = []; // 数据模型数组

        $scope.iResource = this.iResource = ng.extend(promises(), {
            defer: Service.defer, // Promise
            get: get, // 获取
            paging: paging, // 分页
            patch: patch, // 补充
            remove: remove, // 删除
            resolveOptions: resolveOptions, // 配置解析
            save: save, // 保存
            update: update // 更新
        });

        function get(options) {
            options = resolveOptions(options);
            return Service.promises.get(options.data).then(function (data) {
                vm.model = data;
                return data;
            });
        }

        function paging(options) {
            options = resolveOptions(options);
            return Service.promises.paging(options.data).then(function (data) {
                vm.paging = data;
                vm.models = data.content;
                return data;
            });
        }

        function patch(options) {
            options = resolveOptions(options);
            return Service.promises.patch(options.data).then(function (data) {
                vm.model = data;
                return data;
            });
        }

        function remove(options) {
            options = resolveOptions(options);
            return Service.promises.remove(options.data).then(function (data) {
                dialogs.notify(data);
                return data;
            });
        }

        /**
         * 解析Action
         */
        function resolveAction() {
            if ($stateParams.action) {
                var isAction = 'is' + iUtil.upperCaseFirst($stateParams.action);
                vm[isAction] = true;
            }
        }

        /**
         * 解析参数
         * @param options
         */
        function resolveOptions(options) {
            if (options) {
                // 判断options是不是请求参数
                if (ng.isUndefined(options.data) && ng.isUndefined(options.contentType))
                    options = {data: options};
            } else options = {};
            options.data = options.data || vm.model;
            return options;
        }

        function save(options) {
            options = resolveOptions(options);
            return Service.promises.save(options.data).then(function (data) {
                vm.model = data;
                return data;
            });
        }

        function update(options) {
            options = resolveOptions(options);
            return Service.promises.update(options.data).then(function (data) {
                vm.model = data;
                return data;
            });
        }

        function promises() {
            var promises = {};
            for (var name in Service.promises) {
                var promise = Service.promises[name];
                promises[name] = new PromiseCache(name, promise).get();
            }
            return promises;
        }

        /**
         * 缓存Promise(解决循环索引问题)
         * @param name
         * @param promise
         * @constructor
         */
        function PromiseCache(name, promise) {
            var cache = this;
            this.name = name;
            this.promise = promise;
            this.get = function () {
                return function (options) {
                    options = resolveOptions(options);
                    return cache.promise(options.data);
                }
            }
        }
    }

    // function Cache(data, object) {
    //     this.data = data;
    //     this.object = object;
    //     this.get = function (cache) {
    //         return cache.object;
    //     }
    // }
})(iApp.module(), window.angular);