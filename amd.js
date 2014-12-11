;(function(w){

	var _definedModules = {};

	w.requireConfig = {
		urlArgs:"",
		paths:{}
	};

	function Module(name, deps, body){

		this.name = name;
		this.path = parsePath(name);
		this.dependencies = deps || [];
		this.loaded = false;
		this.data = null;
		this.body = body || null;
		this._loading = false;

		this._clients = [];

		setTimeout(this.build.bind(this), 0);
	}

	Module.prototype.load = function(){

		var thisRef = this;

		if(this.loaded){
			this.update();
			return;
		}

		this._loading = true;

		var 
			tag = document.createElement("script"),
			_loaded = false
		;

		document.head.appendChild(tag);
		tag.async = true;
		tag.setAttribute("data-module", this.name);
		tag.onload = tag.onreadystatechange = function(){
			if((tag.readyState && tag.readyState !== "complete" && tag.readyState !== "loaded") || _loaded) return false;

			tag.onload = tag.onreadystatechange = null;
			_loaded = true;
			setTimeout(function(){
				thisRef._loading = false;
				thisRef.build.call(thisRef);
			},0);
		};
		tag.src = this.path;
	};

	Module.prototype.build = function(){

		if(this.loaded){
			this.update();
			return;
		}

		var thisRef = this;
		var modules = [];

		if(this.dependencies.length > 0){
			modules = gatherModules(this.dependencies, function(){
				thisRef.build.call(thisRef);
			});
		}

		if(modules === false) return;

		if(typeof this.body == "function" || this.body instanceof Function){
			this.data = this.body.apply(w, modules);
		}
		else{
			this.data = this.body;
		}

		this.loaded = true;
		this.update();
	};

	Module.prototype.update = function(){

		if(this.loaded == false || this._clients.length == 0) return;

		for(var i = this._clients.length; i>=0; i--){
			if(this._clients[i]) this._clients[i](this);
		}

		this._clients.length = 0;
	};

	Module.prototype.onload = function(callback){

		this._clients.push(callback);
	};

	function parsePath(url){

		var sections = url.split("/");

		if(sections[0] in w.requireConfig.paths){
			sections[0] = w.requireConfig.paths[sections[0]];
		}
		return sections.join("/") + ".js" + w.requireConfig.urlArgs;
	}

	function gatherModules(deps, callback){

		var 
			len = deps.length,
			modules = Array(len),
			dep,
			i = 0
		;

		for(i; i<len; i++){
			dep = _definedModules[deps[i]];
			if(!dep){
				dep = new Module(deps[i]);
			}
			if(dep.loaded == false){
				dep.onload(callback);
				return false;
			}

			modules[i] = dep.data;
		}

		return modules;
	}

	//Public

	w.require = function(deps, callback){

		var i = 0;

		if(deps.length == 0){
			callback();
			return;
		}

		for(i; i<deps.length; i++){

			if(!_definedModules[deps[i]]){
				_definedModules[deps[i]] = new Module(deps[i]);
			}
			_definedModules[deps[i]].onload(function(){
				var modules = gatherModules(deps);
				if(modules !== false) callback.apply(w, modules);
			});
			(function(_i){
				_definedModules[deps[_i]].load();
			})(i);
		}
	};

	w.define = function(moduleName, deps, callback){

		if(arguments.length == 2){
			var scripts = document.getElementsByTagName( 'script' );
			var me = scripts[ scripts.length - 1 ];
			callback = deps;
			deps = moduleName;
			moduleName = me.getAttribute("data-module");
		}

		if(_definedModules[moduleName]){
			_definedModules[moduleName].dependencies = deps;
			_definedModules[moduleName].body = callback;
			_definedModules[moduleName].build();
		}
		else{
			_definedModules[moduleName] = new Module(moduleName, deps, callback);
		}
	};

	w.undefine = function(moduleName){
		delete _definedModules[moduleName];
	};

	//debug
	w.amdList = function(){
		console.log(_definedModules);
	};

})(window);