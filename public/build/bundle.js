
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src\components\Card.svelte generated by Svelte v3.59.2 */

    const file$7 = "src\\components\\Card.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card svelte-128kbgw");
    			add_location(div, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\Feedbackitem.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\components\\Feedbackitem.svelte";

    // (14:0) <Card>
    function create_default_slot$1(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[0].rating + "";
    	let t0;
    	let t1;
    	let button;
    	let t3;
    	let p;
    	let t4_value = /*item*/ ctx[0].text + "";
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			button.textContent = "X";
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			attr_dev(div, "class", "num-display svelte-d2a937");
    			add_location(div, file$6, 14, 4, 290);
    			attr_dev(button, "class", "close svelte-d2a937");
    			add_location(button, file$6, 17, 4, 354);
    			attr_dev(p, "class", "text-display svelte-d2a937");
    			add_location(p, file$6, 18, 4, 431);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].rating + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*item*/ ctx[0].text + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(14:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, item*/ 17) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Feedbackitem', slots, []);
    	let { item } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleDelete = itemId => {
    		dispatch('delete-feedback', itemId);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Feedbackitem> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Feedbackitem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleDelete(item.id);

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Card,
    		item,
    		dispatch,
    		handleDelete
    	});

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, handleDelete, click_handler];
    }

    class Feedbackitem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feedbackitem",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get item() {
    		throw new Error("<Feedbackitem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Feedbackitem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Feedbacklist.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$5 = "src\\components\\Feedbacklist.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (10:0) {#each feedback as fb (fb.id) }
    function create_each_block(key_1, ctx) {
    	let div;
    	let feedbackitem;
    	let t;
    	let div_intro;
    	let div_outro;
    	let current;

    	feedbackitem = new Feedbackitem({
    			props: { item: /*fb*/ ctx[2] },
    			$$inline: true
    		});

    	feedbackitem.$on("delete-feedback", /*delete_feedback_handler*/ ctx[1]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(feedbackitem.$$.fragment);
    			t = space();
    			add_location(div, file$5, 10, 0, 224);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(feedbackitem, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const feedbackitem_changes = {};
    			if (dirty & /*feedback*/ 1) feedbackitem_changes.item = /*fb*/ ctx[2];
    			feedbackitem.$set(feedbackitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(feedbackitem.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, scale, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(feedbackitem.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 400 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(feedbackitem);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:0) {#each feedback as fb (fb.id) }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*feedback*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*fb*/ ctx[2].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*feedback*/ 1) {
    				each_value = /*feedback*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Feedbacklist', slots, []);
    	let { feedback = [] } = $$props;
    	console.log(feedback);
    	const writable_props = ['feedback'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Feedbacklist> was created with unknown prop '${key}'`);
    	});

    	function delete_feedback_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('feedback' in $$props) $$invalidate(0, feedback = $$props.feedback);
    	};

    	$$self.$capture_state = () => ({ fade, scale, Feedbackitem, feedback });

    	$$self.$inject_state = $$props => {
    		if ('feedback' in $$props) $$invalidate(0, feedback = $$props.feedback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [feedback, delete_feedback_handler];
    }

    class Feedbacklist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { feedback: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feedbacklist",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get feedback() {
    		throw new Error("<Feedbacklist>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set feedback(value) {
    		throw new Error("<Feedbacklist>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\FeedbackStats.svelte generated by Svelte v3.59.2 */

    const file$4 = "src\\components\\FeedbackStats.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h40;
    	let t0;
    	let t1;
    	let t2;
    	let h41;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h40 = element("h4");
    			t0 = text(/*count*/ ctx[0]);
    			t1 = text(" Reviews");
    			t2 = space();
    			h41 = element("h4");
    			t3 = text("Rating Average: ");
    			t4 = text(/*average*/ ctx[1]);
    			add_location(h40, file$4, 5, 4, 103);
    			add_location(h41, file$4, 6, 4, 133);
    			attr_dev(div, "class", "feedback-stats svelte-bpu85m");
    			add_location(div, file$4, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h40);
    			append_dev(h40, t0);
    			append_dev(h40, t1);
    			append_dev(div, t2);
    			append_dev(div, h41);
    			append_dev(h41, t3);
    			append_dev(h41, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*count*/ 1) set_data_dev(t0, /*count*/ ctx[0]);
    			if (dirty & /*average*/ 2) set_data_dev(t4, /*average*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FeedbackStats', slots, []);
    	let { count } = $$props;
    	let { average } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (count === undefined && !('count' in $$props || $$self.$$.bound[$$self.$$.props['count']])) {
    			console.warn("<FeedbackStats> was created without expected prop 'count'");
    		}

    		if (average === undefined && !('average' in $$props || $$self.$$.bound[$$self.$$.props['average']])) {
    			console.warn("<FeedbackStats> was created without expected prop 'average'");
    		}
    	});

    	const writable_props = ['count', 'average'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FeedbackStats> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('count' in $$props) $$invalidate(0, count = $$props.count);
    		if ('average' in $$props) $$invalidate(1, average = $$props.average);
    	};

    	$$self.$capture_state = () => ({ count, average });

    	$$self.$inject_state = $$props => {
    		if ('count' in $$props) $$invalidate(0, count = $$props.count);
    		if ('average' in $$props) $$invalidate(1, average = $$props.average);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [count, average];
    }

    class FeedbackStats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { count: 0, average: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FeedbackStats",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get count() {
    		throw new Error("<FeedbackStats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<FeedbackStats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get average() {
    		throw new Error("<FeedbackStats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set average(value) {
    		throw new Error("<FeedbackStats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }

    function unsafeStringify(arr, offset = 0) {
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = {
      randomUUID
    };

    function v4(options, buf, offset) {
      if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
      }

      options = options || {};
      const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return unsafeStringify(rnds);
    }

    /* src\components\Button.svelte generated by Svelte v3.59.2 */

    const file$3 = "src\\components\\Button.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", /*type*/ ctx[1]);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*style*/ ctx[0]) + " svelte-1hshxze"));
    			add_location(button, file$3, 6, 2, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*type*/ 2) {
    				attr_dev(button, "type", /*type*/ ctx[1]);
    			}

    			if (!current || dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (!current || dirty & /*style*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*style*/ ctx[0]) + " svelte-1hshxze"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { style = 'primary' } = $$props;
    	let { type = 'button' } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['style', 'type', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ style, type, disabled });

    	$$self.$inject_state = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style, type, disabled, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { style: 0, type: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\RatingSelete.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\RatingSelete.svelte";

    function create_fragment$2(ctx) {
    	let ul;
    	let li0;
    	let input0;
    	let input0_checked_value;
    	let t0;
    	let label0;
    	let t2;
    	let li1;
    	let input1;
    	let input1_checked_value;
    	let t3;
    	let label1;
    	let t5;
    	let li2;
    	let input2;
    	let input2_checked_value;
    	let t6;
    	let label2;
    	let t8;
    	let li3;
    	let input3;
    	let input3_checked_value;
    	let t9;
    	let label3;
    	let t11;
    	let li4;
    	let input4;
    	let input4_checked_value;
    	let t12;
    	let label4;
    	let t14;
    	let li5;
    	let input5;
    	let input5_checked_value;
    	let t15;
    	let label5;
    	let t17;
    	let li6;
    	let input6;
    	let input6_checked_value;
    	let t18;
    	let label6;
    	let t20;
    	let li7;
    	let input7;
    	let input7_checked_value;
    	let t21;
    	let label7;
    	let t23;
    	let li8;
    	let input8;
    	let input8_checked_value;
    	let t24;
    	let label8;
    	let t26;
    	let li9;
    	let input9;
    	let input9_checked_value;
    	let t27;
    	let label9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			input0 = element("input");
    			t0 = space();
    			label0 = element("label");
    			label0.textContent = "1";
    			t2 = space();
    			li1 = element("li");
    			input1 = element("input");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "2";
    			t5 = space();
    			li2 = element("li");
    			input2 = element("input");
    			t6 = space();
    			label2 = element("label");
    			label2.textContent = "3";
    			t8 = space();
    			li3 = element("li");
    			input3 = element("input");
    			t9 = space();
    			label3 = element("label");
    			label3.textContent = "4";
    			t11 = space();
    			li4 = element("li");
    			input4 = element("input");
    			t12 = space();
    			label4 = element("label");
    			label4.textContent = "5";
    			t14 = space();
    			li5 = element("li");
    			input5 = element("input");
    			t15 = space();
    			label5 = element("label");
    			label5.textContent = "6";
    			t17 = space();
    			li6 = element("li");
    			input6 = element("input");
    			t18 = space();
    			label6 = element("label");
    			label6.textContent = "7";
    			t20 = space();
    			li7 = element("li");
    			input7 = element("input");
    			t21 = space();
    			label7 = element("label");
    			label7.textContent = "8";
    			t23 = space();
    			li8 = element("li");
    			input8 = element("input");
    			t24 = space();
    			label8 = element("label");
    			label8.textContent = "9";
    			t26 = space();
    			li9 = element("li");
    			input9 = element("input");
    			t27 = space();
    			label9 = element("label");
    			label9.textContent = "10";
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "id", "num1");
    			attr_dev(input0, "name", "rating");
    			input0.value = "1";
    			input0.checked = input0_checked_value = /*selected*/ ctx[0] === 1;
    			attr_dev(input0, "class", "svelte-1kcshlz");
    			add_location(input0, file$2, 15, 6, 318);
    			attr_dev(label0, "for", "num1");
    			attr_dev(label0, "class", "svelte-1kcshlz");
    			add_location(label0, file$2, 16, 6, 426);
    			attr_dev(li0, "class", "svelte-1kcshlz");
    			add_location(li0, file$2, 14, 4, 306);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "id", "num2");
    			attr_dev(input1, "name", "rating");
    			input1.value = "2";
    			input1.checked = input1_checked_value = /*selected*/ ctx[0] === 2;
    			attr_dev(input1, "class", "svelte-1kcshlz");
    			add_location(input1, file$2, 19, 6, 482);
    			attr_dev(label1, "for", "num2");
    			attr_dev(label1, "class", "svelte-1kcshlz");
    			add_location(label1, file$2, 20, 6, 590);
    			attr_dev(li1, "class", "svelte-1kcshlz");
    			add_location(li1, file$2, 18, 4, 470);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "id", "num3");
    			attr_dev(input2, "name", "rating");
    			input2.value = "3";
    			input2.checked = input2_checked_value = /*selected*/ ctx[0] === 3;
    			attr_dev(input2, "class", "svelte-1kcshlz");
    			add_location(input2, file$2, 23, 6, 646);
    			attr_dev(label2, "for", "num3");
    			attr_dev(label2, "class", "svelte-1kcshlz");
    			add_location(label2, file$2, 24, 6, 754);
    			attr_dev(li2, "class", "svelte-1kcshlz");
    			add_location(li2, file$2, 22, 4, 634);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "id", "num4");
    			attr_dev(input3, "name", "rating");
    			input3.value = "4";
    			input3.checked = input3_checked_value = /*selected*/ ctx[0] === 4;
    			attr_dev(input3, "class", "svelte-1kcshlz");
    			add_location(input3, file$2, 27, 6, 810);
    			attr_dev(label3, "for", "num4");
    			attr_dev(label3, "class", "svelte-1kcshlz");
    			add_location(label3, file$2, 28, 6, 918);
    			attr_dev(li3, "class", "svelte-1kcshlz");
    			add_location(li3, file$2, 26, 4, 798);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "id", "num5");
    			attr_dev(input4, "name", "rating");
    			input4.value = "5";
    			input4.checked = input4_checked_value = /*selected*/ ctx[0] === 5;
    			attr_dev(input4, "class", "svelte-1kcshlz");
    			add_location(input4, file$2, 31, 6, 974);
    			attr_dev(label4, "for", "num5");
    			attr_dev(label4, "class", "svelte-1kcshlz");
    			add_location(label4, file$2, 32, 6, 1082);
    			attr_dev(li4, "class", "svelte-1kcshlz");
    			add_location(li4, file$2, 30, 4, 962);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "id", "num6");
    			attr_dev(input5, "name", "rating");
    			input5.value = "6";
    			input5.checked = input5_checked_value = /*selected*/ ctx[0] === 6;
    			attr_dev(input5, "class", "svelte-1kcshlz");
    			add_location(input5, file$2, 35, 6, 1138);
    			attr_dev(label5, "for", "num6");
    			attr_dev(label5, "class", "svelte-1kcshlz");
    			add_location(label5, file$2, 36, 6, 1246);
    			attr_dev(li5, "class", "svelte-1kcshlz");
    			add_location(li5, file$2, 34, 4, 1126);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "id", "num7");
    			attr_dev(input6, "name", "rating");
    			input6.value = "7";
    			input6.checked = input6_checked_value = /*selected*/ ctx[0] === 7;
    			attr_dev(input6, "class", "svelte-1kcshlz");
    			add_location(input6, file$2, 39, 6, 1302);
    			attr_dev(label6, "for", "num7");
    			attr_dev(label6, "class", "svelte-1kcshlz");
    			add_location(label6, file$2, 40, 6, 1410);
    			attr_dev(li6, "class", "svelte-1kcshlz");
    			add_location(li6, file$2, 38, 4, 1290);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "id", "num8");
    			attr_dev(input7, "name", "rating");
    			input7.value = "8";
    			input7.checked = input7_checked_value = /*selected*/ ctx[0] === 8;
    			attr_dev(input7, "class", "svelte-1kcshlz");
    			add_location(input7, file$2, 43, 6, 1466);
    			attr_dev(label7, "for", "num8");
    			attr_dev(label7, "class", "svelte-1kcshlz");
    			add_location(label7, file$2, 44, 6, 1574);
    			attr_dev(li7, "class", "svelte-1kcshlz");
    			add_location(li7, file$2, 42, 4, 1454);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "id", "num9");
    			attr_dev(input8, "name", "rating");
    			input8.value = "9";
    			input8.checked = input8_checked_value = /*selected*/ ctx[0] === 9;
    			attr_dev(input8, "class", "svelte-1kcshlz");
    			add_location(input8, file$2, 47, 6, 1630);
    			attr_dev(label8, "for", "num9");
    			attr_dev(label8, "class", "svelte-1kcshlz");
    			add_location(label8, file$2, 48, 6, 1738);
    			attr_dev(li8, "class", "svelte-1kcshlz");
    			add_location(li8, file$2, 46, 4, 1618);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "id", "num10");
    			attr_dev(input9, "name", "rating");
    			input9.value = "10";
    			input9.checked = input9_checked_value = /*selected*/ ctx[0] === 10;
    			attr_dev(input9, "class", "svelte-1kcshlz");
    			add_location(input9, file$2, 51, 6, 1794);
    			attr_dev(label9, "for", "num10");
    			attr_dev(label9, "class", "svelte-1kcshlz");
    			add_location(label9, file$2, 52, 6, 1905);
    			attr_dev(li9, "class", "svelte-1kcshlz");
    			add_location(li9, file$2, 50, 4, 1782);
    			attr_dev(ul, "class", "rating svelte-1kcshlz");
    			add_location(ul, file$2, 13, 2, 281);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, input0);
    			append_dev(li0, t0);
    			append_dev(li0, label0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, input1);
    			append_dev(li1, t3);
    			append_dev(li1, label1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, input2);
    			append_dev(li2, t6);
    			append_dev(li2, label2);
    			append_dev(ul, t8);
    			append_dev(ul, li3);
    			append_dev(li3, input3);
    			append_dev(li3, t9);
    			append_dev(li3, label3);
    			append_dev(ul, t11);
    			append_dev(ul, li4);
    			append_dev(li4, input4);
    			append_dev(li4, t12);
    			append_dev(li4, label4);
    			append_dev(ul, t14);
    			append_dev(ul, li5);
    			append_dev(li5, input5);
    			append_dev(li5, t15);
    			append_dev(li5, label5);
    			append_dev(ul, t17);
    			append_dev(ul, li6);
    			append_dev(li6, input6);
    			append_dev(li6, t18);
    			append_dev(li6, label6);
    			append_dev(ul, t20);
    			append_dev(ul, li7);
    			append_dev(li7, input7);
    			append_dev(li7, t21);
    			append_dev(li7, label7);
    			append_dev(ul, t23);
    			append_dev(ul, li8);
    			append_dev(li8, input8);
    			append_dev(li8, t24);
    			append_dev(li8, label8);
    			append_dev(ul, t26);
    			append_dev(ul, li9);
    			append_dev(li9, input9);
    			append_dev(li9, t27);
    			append_dev(li9, label9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input1, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input2, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input3, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input4, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input5, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input6, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input7, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input8, "change", /*onChange*/ ctx[1], false, false, false, false),
    					listen_dev(input9, "change", /*onChange*/ ctx[1], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 1 && input0_checked_value !== (input0_checked_value = /*selected*/ ctx[0] === 1)) {
    				prop_dev(input0, "checked", input0_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input1_checked_value !== (input1_checked_value = /*selected*/ ctx[0] === 2)) {
    				prop_dev(input1, "checked", input1_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input2_checked_value !== (input2_checked_value = /*selected*/ ctx[0] === 3)) {
    				prop_dev(input2, "checked", input2_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input3_checked_value !== (input3_checked_value = /*selected*/ ctx[0] === 4)) {
    				prop_dev(input3, "checked", input3_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input4_checked_value !== (input4_checked_value = /*selected*/ ctx[0] === 5)) {
    				prop_dev(input4, "checked", input4_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input5_checked_value !== (input5_checked_value = /*selected*/ ctx[0] === 6)) {
    				prop_dev(input5, "checked", input5_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input6_checked_value !== (input6_checked_value = /*selected*/ ctx[0] === 7)) {
    				prop_dev(input6, "checked", input6_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input7_checked_value !== (input7_checked_value = /*selected*/ ctx[0] === 8)) {
    				prop_dev(input7, "checked", input7_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input8_checked_value !== (input8_checked_value = /*selected*/ ctx[0] === 9)) {
    				prop_dev(input8, "checked", input8_checked_value);
    			}

    			if (dirty & /*selected*/ 1 && input9_checked_value !== (input9_checked_value = /*selected*/ ctx[0] === 10)) {
    				prop_dev(input9, "checked", input9_checked_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RatingSelete', slots, []);
    	let selected = 10;
    	const dispatch = createEventDispatcher();

    	const onChange = e => {
    		$$invalidate(0, selected = e.currentTarget.value);
    		dispatch('rating-select', selected);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RatingSelete> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		selected,
    		dispatch,
    		onChange
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, onChange];
    }

    class RatingSelete extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RatingSelete",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\FeedbackForm.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\components\\FeedbackForm.svelte";

    // (47:8) <Button disabled={btndisabled} type="submit">
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(47:8) <Button disabled={btndisabled} type=\\\"submit\\\">",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if message}
    function create_if_block(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*message*/ ctx[1]);
    			attr_dev(div, "class", "message svelte-vmm4mo");
    			add_location(div, file$1, 49, 8, 1469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 2) set_data_dev(t, /*message*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(49:4) {#if message}",
    		ctx
    	});

    	return block;
    }

    // (37:0) <Card>
    function create_default_slot(ctx) {
    	let header;
    	let h2;
    	let t1;
    	let form;
    	let ratingselete;
    	let t2;
    	let div;
    	let input;
    	let t3;
    	let button;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	ratingselete = new RatingSelete({ $$inline: true });
    	ratingselete.$on("rating-select", /*handleSelect*/ ctx[3]);

    	button = new Button({
    			props: {
    				disabled: /*btndisabled*/ ctx[0],
    				type: "submit",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*message*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			h2 = element("h2");
    			h2.textContent = "How would you rate your service with us?";
    			t1 = space();
    			form = element("form");
    			create_component(ratingselete.$$.fragment);
    			t2 = space();
    			div = element("div");
    			input = element("input");
    			t3 = space();
    			create_component(button.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(h2, "class", "svelte-vmm4mo");
    			add_location(h2, file$1, 38, 8, 1030);
    			attr_dev(header, "class", "svelte-vmm4mo");
    			add_location(header, file$1, 37, 4, 1012);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Tell us something that keeps you coming back");
    			attr_dev(input, "class", "svelte-vmm4mo");
    			add_location(input, file$1, 45, 8, 1241);
    			attr_dev(div, "class", "input-group svelte-vmm4mo");
    			add_location(div, file$1, 44, 4, 1206);
    			add_location(form, file$1, 42, 0, 1100);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(ratingselete, form, null);
    			append_dev(form, t2);
    			append_dev(form, div);
    			append_dev(div, input);
    			set_input_value(input, /*text*/ ctx[2]);
    			append_dev(div, t3);
    			mount_component(button, div, null);
    			append_dev(form, t4);
    			if (if_block) if_block.m(form, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*handleInput*/ ctx[4], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[5]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 4 && input.value !== /*text*/ ctx[2]) {
    				set_input_value(input, /*text*/ ctx[2]);
    			}

    			const button_changes = {};
    			if (dirty & /*btndisabled*/ 1) button_changes.disabled = /*btndisabled*/ ctx[0];

    			if (dirty & /*$$scope*/ 1024) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (/*message*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(form, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ratingselete.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ratingselete.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			destroy_component(ratingselete);
    			destroy_component(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(37:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, message, btndisabled, text*/ 1031) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FeedbackForm', slots, []);
    	let btndisabled = true;
    	let min = 10;
    	let rating = 10;
    	let message;
    	let text = '';
    	const dispatch = createEventDispatcher();
    	const handleSelect = e => rating = e.detail;

    	const handleInput = () => {
    		if (text.trim().length <= min) {
    			$$invalidate(1, message = `Text must be at least ${min} characters`);
    			$$invalidate(0, btndisabled = true);
    		} else {
    			$$invalidate(1, message = null);
    			$$invalidate(0, btndisabled = false);
    		}
    	};

    	const handleSubmit = () => {
    		if (text.trim().length > min) {
    			const newFeedback = {
    				id: v4(), //generate a unique id for each feedback item
    				text,
    				rating: +rating
    			};

    			dispatch('add-feedback', newFeedback);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FeedbackForm> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		text = this.value;
    		$$invalidate(2, text);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		uuidv4: v4,
    		Button,
    		Card,
    		RatingSelete,
    		btndisabled,
    		min,
    		rating,
    		message,
    		text,
    		dispatch,
    		handleSelect,
    		handleInput,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('btndisabled' in $$props) $$invalidate(0, btndisabled = $$props.btndisabled);
    		if ('min' in $$props) min = $$props.min;
    		if ('rating' in $$props) rating = $$props.rating;
    		if ('message' in $$props) $$invalidate(1, message = $$props.message);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		btndisabled,
    		message,
    		text,
    		handleSelect,
    		handleInput,
    		handleSubmit,
    		input_input_handler
    	];
    }

    class FeedbackForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FeedbackForm",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let feedbackform;
    	let t0;
    	let feedbackstats;
    	let t1;
    	let feedbacklist;
    	let current;
    	feedbackform = new FeedbackForm({ $$inline: true });
    	feedbackform.$on("add-feedback", /*addFeedback*/ ctx[4]);

    	feedbackstats = new FeedbackStats({
    			props: {
    				count: /*count*/ ctx[2],
    				average: /*average*/ ctx[1]
    			},
    			$$inline: true
    		});

    	feedbacklist = new Feedbacklist({
    			props: { feedback: /*feedback*/ ctx[0] },
    			$$inline: true
    		});

    	feedbacklist.$on("delete-feedback", /*deleteFeedback*/ ctx[3]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(feedbackform.$$.fragment);
    			t0 = space();
    			create_component(feedbackstats.$$.fragment);
    			t1 = space();
    			create_component(feedbacklist.$$.fragment);
    			attr_dev(main, "class", "container");
    			add_location(main, file, 39, 0, 2381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(feedbackform, main, null);
    			append_dev(main, t0);
    			mount_component(feedbackstats, main, null);
    			append_dev(main, t1);
    			mount_component(feedbacklist, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const feedbackstats_changes = {};
    			if (dirty & /*count*/ 4) feedbackstats_changes.count = /*count*/ ctx[2];
    			if (dirty & /*average*/ 2) feedbackstats_changes.average = /*average*/ ctx[1];
    			feedbackstats.$set(feedbackstats_changes);
    			const feedbacklist_changes = {};
    			if (dirty & /*feedback*/ 1) feedbacklist_changes.feedback = /*feedback*/ ctx[0];
    			feedbacklist.$set(feedbacklist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(feedbackform.$$.fragment, local);
    			transition_in(feedbackstats.$$.fragment, local);
    			transition_in(feedbacklist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(feedbackform.$$.fragment, local);
    			transition_out(feedbackstats.$$.fragment, local);
    			transition_out(feedbacklist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(feedbackform);
    			destroy_component(feedbackstats);
    			destroy_component(feedbacklist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let count;
    	let average;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let feedback = [
    		{
    			id: 1,
    			rating: 10,
    			text: 'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'
    		},
    		{
    			id: 2,
    			rating: 9,
    			text: 'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'
    		},
    		{
    			id: 3,
    			rating: 8,
    			text: 'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'
    		}
    	];

    	const deleteFeedback = e => {
    		const itemId = e.detail;
    		$$invalidate(0, feedback = feedback.filter(item => item.id != itemId));
    	};

    	const addFeedback = e => {
    		const newFeedback = e.detail;
    		$$invalidate(0, feedback = [newFeedback, ...feedback]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Feedbacklist,
    		Feedbackitem,
    		FeedbackStats,
    		FeedbackForm,
    		feedback,
    		deleteFeedback,
    		addFeedback,
    		average,
    		count
    	});

    	$$self.$inject_state = $$props => {
    		if ('feedback' in $$props) $$invalidate(0, feedback = $$props.feedback);
    		if ('average' in $$props) $$invalidate(1, average = $$props.average);
    		if ('count' in $$props) $$invalidate(2, count = $$props.count);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*feedback*/ 1) {
    			$$invalidate(2, count = feedback.length);
    		}

    		if ($$self.$$.dirty & /*feedback*/ 1) {
    			$$invalidate(1, average = feedback.reduce((a, { rating }) => a + rating, 0) / feedback.length);
    		}
    	};

    	return [feedback, average, count, deleteFeedback, addFeedback];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
