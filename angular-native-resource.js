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
    Controller.$inject = ['$scope', 'dialogs', 'module', 'iResource'];

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
                'update': {method: 'PUT'}
            }
        };

        // 方法引用
        this.$get = ['$resource', constructor];

        // 构造方法
        function constructor($resource) {
            return resourceFactory;

            function resourceFactory(url, paramDefaults, actions, options) {
                actions = ng.extend({}, provider.defaults.actions, actions);
                resolveActions(actions);
                return $resource(url, paramDefaults, actions, options);
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
        }
    }

    /**
     * 控制器
     * @constructor
     */
    function Controller($scope, dialogs, module, Service) {
        var vm = this;

        this.model = {}; // 数据模型
        this.models = []; // 数据模型数组

        this.get = get; // 获取
        this.remove = remove; // 删除
        this.save = save; // 保存
        this.update = update; // 更新

        function save(model, options) {
            Service.save(model).then(function (data) {
                vm.model = data;
            });
        }

        function update(model, options) {
            Service.update(model).then(function (data) {
                vm.model = data;
            });
        }

        function get(model, options) {
            Service.get(model).then(function (data) {
                vm.model = data;
            });
        }

        function remove(model, options) {
            Service.remove(model).then(function (data) {
                dialogs.notify(data);
            });
        }
    }
})(iApp.module(), window.angular);