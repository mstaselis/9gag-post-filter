(function () {
  "use strict";
  var C = document,
    D = window,
    st = C.documentElement,
    L = C.createElement.bind(C),
    ft = L("div"),
    q = L("table"),
    Mt = L("tbody"),
    ot = L("tr"),
    H = Array.isArray,
    S = Array.prototype,
    Dt = S.concat,
    U = S.filter,
    at = S.indexOf,
    ct = S.map,
    Bt = S.push,
    ht = S.slice,
    z = S.some,
    _t = S.splice,
    Pt = /^#(?:[\w-]|\\.|[^\x00-\xa0])*$/,
    Ht = /^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/,
    $t = /<.+>/,
    jt = /^\w+$/;
  function J(t, n) {
    var r = It(n);
    return !t || (!r && !A(n) && !c(n))
      ? []
      : !r && Ht.test(t)
        ? n.getElementsByClassName(t.slice(1).replace(/\\/g, ""))
        : !r && jt.test(t)
          ? n.getElementsByTagName(t)
          : n.querySelectorAll(t);
  }
  var dt = (function () {
      function t(n, r) {
        if (n) {
          if (Y(n)) return n;
          var i = n;
          if (g(n)) {
            var e = r || C;
            if (
              ((i =
                Pt.test(n) && A(e)
                  ? e.getElementById(n.slice(1).replace(/\\/g, ""))
                  : $t.test(n)
                    ? yt(n)
                    : Y(e)
                      ? e.find(n)
                      : g(e)
                        ? o(e).find(n)
                        : J(n, e)),
              !i)
            )
              return;
          } else if (O(n)) return this.ready(n);
          (i.nodeType || i === D) && (i = [i]), (this.length = i.length);
          for (var s = 0, f = this.length; s < f; s++) this[s] = i[s];
        }
      }
      return (
        (t.prototype.init = function (n, r) {
          return new t(n, r);
        }),
        t
      );
    })(),
    u = dt.prototype,
    o = u.init;
  (o.fn = o.prototype = u),
    (u.length = 0),
    (u.splice = _t),
    typeof Symbol == "function" && (u[Symbol.iterator] = S[Symbol.iterator]);
  function Y(t) {
    return t instanceof dt;
  }
  function B(t) {
    return !!t && t === t.window;
  }
  function A(t) {
    return !!t && t.nodeType === 9;
  }
  function It(t) {
    return !!t && t.nodeType === 11;
  }
  function c(t) {
    return !!t && t.nodeType === 1;
  }
  function Ft(t) {
    return !!t && t.nodeType === 3;
  }
  function Wt(t) {
    return typeof t == "boolean";
  }
  function O(t) {
    return typeof t == "function";
  }
  function g(t) {
    return typeof t == "string";
  }
  function v(t) {
    return t === void 0;
  }
  function P(t) {
    return t === null;
  }
  function lt(t) {
    return !isNaN(parseFloat(t)) && isFinite(t);
  }
  function G(t) {
    if (typeof t != "object" || t === null) return !1;
    var n = Object.getPrototypeOf(t);
    return n === null || n === Object.prototype;
  }
  (o.isWindow = B),
    (o.isFunction = O),
    (o.isArray = H),
    (o.isNumeric = lt),
    (o.isPlainObject = G);
  function d(t, n, r) {
    if (r) {
      for (var i = t.length; i--; ) if (n.call(t[i], i, t[i]) === !1) return t;
    } else if (G(t))
      for (var e = Object.keys(t), i = 0, s = e.length; i < s; i++) {
        var f = e[i];
        if (n.call(t[f], f, t[f]) === !1) return t;
      }
    else
      for (var i = 0, s = t.length; i < s; i++)
        if (n.call(t[i], i, t[i]) === !1) return t;
    return t;
  }
  (o.each = d),
    (u.each = function (t) {
      return d(this, t);
    }),
    (u.empty = function () {
      return this.each(function (t, n) {
        for (; n.firstChild; ) n.removeChild(n.firstChild);
      });
    });
  function $() {
    for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
    var r = Wt(t[0]) ? t.shift() : !1,
      i = t.shift(),
      e = t.length;
    if (!i) return {};
    if (!e) return $(r, o, i);
    for (var s = 0; s < e; s++) {
      var f = t[s];
      for (var a in f)
        r && (H(f[a]) || G(f[a]))
          ? ((!i[a] || i[a].constructor !== f[a].constructor) &&
              (i[a] = new f[a].constructor()),
            $(r, i[a], f[a]))
          : (i[a] = f[a]);
    }
    return i;
  }
  (o.extend = $),
    (u.extend = function (t) {
      return $(u, t);
    });
  var qt = /\S+/g;
  function j(t) {
    return g(t) ? t.match(qt) || [] : [];
  }
  (u.toggleClass = function (t, n) {
    var r = j(t),
      i = !v(n);
    return this.each(function (e, s) {
      c(s) &&
        d(r, function (f, a) {
          i
            ? n
              ? s.classList.add(a)
              : s.classList.remove(a)
            : s.classList.toggle(a);
        });
    });
  }),
    (u.addClass = function (t) {
      return this.toggleClass(t, !0);
    }),
    (u.removeAttr = function (t) {
      var n = j(t);
      return this.each(function (r, i) {
        c(i) &&
          d(n, function (e, s) {
            i.removeAttribute(s);
          });
      });
    });
  function Ut(t, n) {
    if (t) {
      if (g(t)) {
        if (arguments.length < 2) {
          if (!this[0] || !c(this[0])) return;
          var r = this[0].getAttribute(t);
          return P(r) ? void 0 : r;
        }
        return v(n)
          ? this
          : P(n)
            ? this.removeAttr(t)
            : this.each(function (e, s) {
                c(s) && s.setAttribute(t, n);
              });
      }
      for (var i in t) this.attr(i, t[i]);
      return this;
    }
  }
  (u.attr = Ut),
    (u.removeClass = function (t) {
      return arguments.length
        ? this.toggleClass(t, !1)
        : this.attr("class", "");
    }),
    (u.hasClass = function (t) {
      return (
        !!t &&
        z.call(this, function (n) {
          return c(n) && n.classList.contains(t);
        })
      );
    }),
    (u.get = function (t) {
      return v(t)
        ? ht.call(this)
        : ((t = Number(t)), this[t < 0 ? t + this.length : t]);
    }),
    (u.eq = function (t) {
      return o(this.get(t));
    }),
    (u.first = function () {
      return this.eq(0);
    }),
    (u.last = function () {
      return this.eq(-1);
    });
  function zt(t) {
    return v(t)
      ? this.get()
          .map(function (n) {
            return c(n) || Ft(n) ? n.textContent : "";
          })
          .join("")
      : this.each(function (n, r) {
          c(r) && (r.textContent = t);
        });
  }
  u.text = zt;
  function T(t, n, r) {
    if (c(t)) {
      var i = D.getComputedStyle(t, null);
      return r ? i.getPropertyValue(n) || void 0 : i[n] || t.style[n];
    }
  }
  function E(t, n) {
    return parseInt(T(t, n), 10) || 0;
  }
  function gt(t, n) {
    return (
      E(t, "border".concat(n ? "Left" : "Top", "Width")) +
      E(t, "padding".concat(n ? "Left" : "Top")) +
      E(t, "padding".concat(n ? "Right" : "Bottom")) +
      E(t, "border".concat(n ? "Right" : "Bottom", "Width"))
    );
  }
  var X = {};
  function Jt(t) {
    if (X[t]) return X[t];
    var n = L(t);
    C.body.insertBefore(n, null);
    var r = T(n, "display");
    return C.body.removeChild(n), (X[t] = r !== "none" ? r : "block");
  }
  function vt(t) {
    return T(t, "display") === "none";
  }
  function pt(t, n) {
    var r = t && (t.matches || t.webkitMatchesSelector || t.msMatchesSelector);
    return !!r && !!n && r.call(t, n);
  }
  function I(t) {
    return g(t)
      ? function (n, r) {
          return pt(r, t);
        }
      : O(t)
        ? t
        : Y(t)
          ? function (n, r) {
              return t.is(r);
            }
          : t
            ? function (n, r) {
                return r === t;
              }
            : function () {
                return !1;
              };
  }
  u.filter = function (t) {
    var n = I(t);
    return o(
      U.call(this, function (r, i) {
        return n.call(r, i, r);
      }),
    );
  };
  function x(t, n) {
    return n ? t.filter(n) : t;
  }
  u.detach = function (t) {
    return (
      x(this, t).each(function (n, r) {
        r.parentNode && r.parentNode.removeChild(r);
      }),
      this
    );
  };
  var Yt = /^\s*<(\w+)[^>]*>/,
    Gt = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,
    mt = { "*": ft, tr: Mt, td: ot, th: ot, thead: q, tbody: q, tfoot: q };
  function yt(t) {
    if (!g(t)) return [];
    if (Gt.test(t)) return [L(RegExp.$1)];
    var n = Yt.test(t) && RegExp.$1,
      r = mt[n] || mt["*"];
    return (r.innerHTML = t), o(r.childNodes).detach().get();
  }
  (o.parseHTML = yt),
    (u.has = function (t) {
      var n = g(t)
        ? function (r, i) {
            return J(t, i).length;
          }
        : function (r, i) {
            return i.contains(t);
          };
      return this.filter(n);
    }),
    (u.not = function (t) {
      var n = I(t);
      return this.filter(function (r, i) {
        return (!g(t) || c(i)) && !n.call(i, r, i);
      });
    });
  function R(t, n, r, i) {
    for (var e = [], s = O(n), f = i && I(i), a = 0, y = t.length; a < y; a++)
      if (s) {
        var h = n(t[a]);
        h.length && Bt.apply(e, h);
      } else
        for (var p = t[a][n]; p != null && !(i && f(-1, p)); )
          e.push(p), (p = r ? p[n] : null);
    return e;
  }
  function bt(t) {
    return t.multiple && t.options
      ? R(
          U.call(t.options, function (n) {
            return n.selected && !n.disabled && !n.parentNode.disabled;
          }),
          "value",
        )
      : t.value || "";
  }
  function Xt(t) {
    return arguments.length
      ? this.each(function (n, r) {
          var i = r.multiple && r.options;
          if (i || Ot.test(r.type)) {
            var e = H(t) ? ct.call(t, String) : P(t) ? [] : [String(t)];
            i
              ? d(
                  r.options,
                  function (s, f) {
                    f.selected = e.indexOf(f.value) >= 0;
                  },
                  !0,
                )
              : (r.checked = e.indexOf(r.value) >= 0);
          } else r.value = v(t) || P(t) ? "" : t;
        })
      : this[0] && bt(this[0]);
  }
  (u.val = Xt),
    (u.is = function (t) {
      var n = I(t);
      return z.call(this, function (r, i) {
        return n.call(r, i, r);
      });
    }),
    (o.guid = 1);
  function w(t) {
    return t.length > 1
      ? U.call(t, function (n, r, i) {
          return at.call(i, n) === r;
        })
      : t;
  }
  (o.unique = w),
    (u.add = function (t, n) {
      return o(w(this.get().concat(o(t, n).get())));
    }),
    (u.children = function (t) {
      return x(
        o(
          w(
            R(this, function (n) {
              return n.children;
            }),
          ),
        ),
        t,
      );
    }),
    (u.parent = function (t) {
      return x(o(w(R(this, "parentNode"))), t);
    }),
    (u.index = function (t) {
      var n = t ? o(t)[0] : this[0],
        r = t ? this : o(n).parent().children();
      return at.call(r, n);
    }),
    (u.closest = function (t) {
      var n = this.filter(t);
      if (n.length) return n;
      var r = this.parent();
      return r.length ? r.closest(t) : n;
    }),
    (u.siblings = function (t) {
      return x(
        o(
          w(
            R(this, function (n) {
              return o(n).parent().children().not(n);
            }),
          ),
        ),
        t,
      );
    }),
    (u.find = function (t) {
      return o(
        w(
          R(this, function (n) {
            return J(t, n);
          }),
        ),
      );
    });
  var Kt = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
    Qt = /^$|^module$|\/(java|ecma)script/i,
    Vt = ["type", "src", "nonce", "noModule"];
  function Zt(t, n) {
    var r = o(t);
    r.filter("script")
      .add(r.find("script"))
      .each(function (i, e) {
        if (Qt.test(e.type) && st.contains(e)) {
          var s = L("script");
          (s.text = e.textContent.replace(Kt, "")),
            d(Vt, function (f, a) {
              e[a] && (s[a] = e[a]);
            }),
            n.head.insertBefore(s, null),
            n.head.removeChild(s);
        }
      });
  }
  function kt(t, n, r, i, e) {
    i
      ? t.insertBefore(n, r ? t.firstChild : null)
      : t.nodeName === "HTML"
        ? t.parentNode.replaceChild(n, t)
        : t.parentNode.insertBefore(n, r ? t : t.nextSibling),
      e && Zt(n, t.ownerDocument);
  }
  function N(t, n, r, i, e, s, f, a) {
    return (
      d(
        t,
        function (y, h) {
          d(
            o(h),
            function (p, M) {
              d(
                o(n),
                function (b, W) {
                  var rt = r ? M : W,
                    it = r ? W : M,
                    m = r ? p : b;
                  kt(rt, m ? it.cloneNode(!0) : it, i, e, !m);
                },
                a,
              );
            },
            f,
          );
        },
        s,
      ),
      n
    );
  }
  (u.after = function () {
    return N(arguments, this, !1, !1, !1, !0, !0);
  }),
    (u.append = function () {
      return N(arguments, this, !1, !1, !0);
    });
  function tn(t) {
    if (!arguments.length) return this[0] && this[0].innerHTML;
    if (v(t)) return this;
    var n = /<script[\s>]/.test(t);
    return this.each(function (r, i) {
      c(i) && (n ? o(i).empty().append(t) : (i.innerHTML = t));
    });
  }
  (u.html = tn),
    (u.appendTo = function (t) {
      return N(arguments, this, !0, !1, !0);
    }),
    (u.wrapInner = function (t) {
      return this.each(function (n, r) {
        var i = o(r),
          e = i.contents();
        e.length ? e.wrapAll(t) : i.append(t);
      });
    }),
    (u.before = function () {
      return N(arguments, this, !1, !0);
    }),
    (u.wrapAll = function (t) {
      for (var n = o(t), r = n[0]; r.children.length; ) r = r.firstElementChild;
      return this.first().before(n), this.appendTo(r);
    }),
    (u.wrap = function (t) {
      return this.each(function (n, r) {
        var i = o(t)[0];
        o(r).wrapAll(n ? i.cloneNode(!0) : i);
      });
    }),
    (u.insertAfter = function (t) {
      return N(arguments, this, !0, !1, !1, !1, !1, !0);
    }),
    (u.insertBefore = function (t) {
      return N(arguments, this, !0, !0);
    }),
    (u.prepend = function () {
      return N(arguments, this, !1, !0, !0, !0, !0);
    }),
    (u.prependTo = function (t) {
      return N(arguments, this, !0, !0, !0, !1, !1, !0);
    }),
    (u.contents = function () {
      return o(
        w(
          R(this, function (t) {
            return t.tagName === "IFRAME"
              ? [t.contentDocument]
              : t.tagName === "TEMPLATE"
                ? t.content.childNodes
                : t.childNodes;
          }),
        ),
      );
    }),
    (u.next = function (t, n, r) {
      return x(o(w(R(this, "nextElementSibling", n, r))), t);
    }),
    (u.nextAll = function (t) {
      return this.next(t, !0);
    }),
    (u.nextUntil = function (t, n) {
      return this.next(n, !0, t);
    }),
    (u.parents = function (t, n) {
      return x(o(w(R(this, "parentElement", !0, n))), t);
    }),
    (u.parentsUntil = function (t, n) {
      return this.parents(n, t);
    }),
    (u.prev = function (t, n, r) {
      return x(o(w(R(this, "previousElementSibling", n, r))), t);
    }),
    (u.prevAll = function (t) {
      return this.prev(t, !0);
    }),
    (u.prevUntil = function (t, n) {
      return this.prev(n, !0, t);
    }),
    (u.map = function (t) {
      return o(
        Dt.apply(
          [],
          ct.call(this, function (n, r) {
            return t.call(n, r, n);
          }),
        ),
      );
    }),
    (u.clone = function () {
      return this.map(function (t, n) {
        return n.cloneNode(!0);
      });
    }),
    (u.offsetParent = function () {
      return this.map(function (t, n) {
        for (var r = n.offsetParent; r && T(r, "position") === "static"; )
          r = r.offsetParent;
        return r || st;
      });
    }),
    (u.slice = function (t, n) {
      return o(ht.call(this, t, n));
    });
  var nn = /-([a-z])/g;
  function K(t) {
    return t.replace(nn, function (n, r) {
      return r.toUpperCase();
    });
  }
  (u.ready = function (t) {
    var n = function () {
      return setTimeout(t, 0, o);
    };
    return (
      C.readyState !== "loading"
        ? n()
        : C.addEventListener("DOMContentLoaded", n),
      this
    );
  }),
    (u.unwrap = function () {
      return (
        this.parent().each(function (t, n) {
          if (n.tagName !== "BODY") {
            var r = o(n);
            r.replaceWith(r.children());
          }
        }),
        this
      );
    }),
    (u.offset = function () {
      var t = this[0];
      if (t) {
        var n = t.getBoundingClientRect();
        return { top: n.top + D.pageYOffset, left: n.left + D.pageXOffset };
      }
    }),
    (u.position = function () {
      var t = this[0];
      if (t) {
        var n = T(t, "position") === "fixed",
          r = n ? t.getBoundingClientRect() : this.offset();
        if (!n) {
          for (
            var i = t.ownerDocument, e = t.offsetParent || i.documentElement;
            (e === i.body || e === i.documentElement) &&
            T(e, "position") === "static";

          )
            e = e.parentNode;
          if (e !== t && c(e)) {
            var s = o(e).offset();
            (r.top -= s.top + E(e, "borderTopWidth")),
              (r.left -= s.left + E(e, "borderLeftWidth"));
          }
        }
        return {
          top: r.top - E(t, "marginTop"),
          left: r.left - E(t, "marginLeft"),
        };
      }
    });
  var Et = {
    class: "className",
    contenteditable: "contentEditable",
    for: "htmlFor",
    readonly: "readOnly",
    maxlength: "maxLength",
    tabindex: "tabIndex",
    colspan: "colSpan",
    rowspan: "rowSpan",
    usemap: "useMap",
  };
  (u.prop = function (t, n) {
    if (t) {
      if (g(t))
        return (
          (t = Et[t] || t),
          arguments.length < 2
            ? this[0] && this[0][t]
            : this.each(function (i, e) {
                e[t] = n;
              })
        );
      for (var r in t) this.prop(r, t[r]);
      return this;
    }
  }),
    (u.removeProp = function (t) {
      return this.each(function (n, r) {
        delete r[Et[t] || t];
      });
    });
  var rn = /^--/;
  function Q(t) {
    return rn.test(t);
  }
  var V = {},
    en = ft.style,
    un = ["webkit", "moz", "ms"];
  function sn(t, n) {
    if ((n === void 0 && (n = Q(t)), n)) return t;
    if (!V[t]) {
      var r = K(t),
        i = "".concat(r[0].toUpperCase()).concat(r.slice(1)),
        e = ""
          .concat(r, " ")
          .concat(un.join("".concat(i, " ")))
          .concat(i)
          .split(" ");
      d(e, function (s, f) {
        if (f in en) return (V[t] = f), !1;
      });
    }
    return V[t];
  }
  var fn = {
    animationIterationCount: !0,
    columnCount: !0,
    flexGrow: !0,
    flexShrink: !0,
    fontWeight: !0,
    gridArea: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnStart: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowStart: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    widows: !0,
    zIndex: !0,
  };
  function wt(t, n, r) {
    return (
      r === void 0 && (r = Q(t)), !r && !fn[t] && lt(n) ? "".concat(n, "px") : n
    );
  }
  function on(t, n) {
    if (g(t)) {
      var r = Q(t);
      return (
        (t = sn(t, r)),
        arguments.length < 2
          ? this[0] && T(this[0], t, r)
          : t
            ? ((n = wt(t, n, r)),
              this.each(function (e, s) {
                c(s) && (r ? s.style.setProperty(t, n) : (s.style[t] = n));
              }))
            : this
      );
    }
    for (var i in t) this.css(i, t[i]);
    return this;
  }
  u.css = on;
  function Ct(t, n) {
    try {
      return t(n);
    } catch {
      return n;
    }
  }
  var an = /^\s+|\s+$/;
  function St(t, n) {
    var r = t.dataset[n] || t.dataset[K(n)];
    return an.test(r) ? r : Ct(JSON.parse, r);
  }
  function cn(t, n, r) {
    (r = Ct(JSON.stringify, r)), (t.dataset[K(n)] = r);
  }
  function hn(t, n) {
    if (!t) {
      if (!this[0]) return;
      var r = {};
      for (var i in this[0].dataset) r[i] = St(this[0], i);
      return r;
    }
    if (g(t))
      return arguments.length < 2
        ? this[0] && St(this[0], t)
        : v(n)
          ? this
          : this.each(function (e, s) {
              cn(s, t, n);
            });
    for (var i in t) this.data(i, t[i]);
    return this;
  }
  u.data = hn;
  function Tt(t, n) {
    var r = t.documentElement;
    return Math.max(
      t.body["scroll".concat(n)],
      r["scroll".concat(n)],
      t.body["offset".concat(n)],
      r["offset".concat(n)],
      r["client".concat(n)],
    );
  }
  d([!0, !1], function (t, n) {
    d(["Width", "Height"], function (r, i) {
      var e = "".concat(n ? "outer" : "inner").concat(i);
      u[e] = function (s) {
        if (this[0])
          return B(this[0])
            ? n
              ? this[0]["inner".concat(i)]
              : this[0].document.documentElement["client".concat(i)]
            : A(this[0])
              ? Tt(this[0], i)
              : this[0]["".concat(n ? "offset" : "client").concat(i)] +
                (s && n
                  ? E(this[0], "margin".concat(r ? "Top" : "Left")) +
                    E(this[0], "margin".concat(r ? "Bottom" : "Right"))
                  : 0);
      };
    });
  }),
    d(["Width", "Height"], function (t, n) {
      var r = n.toLowerCase();
      u[r] = function (i) {
        if (!this[0]) return v(i) ? void 0 : this;
        if (!arguments.length)
          return B(this[0])
            ? this[0].document.documentElement["client".concat(n)]
            : A(this[0])
              ? Tt(this[0], n)
              : this[0].getBoundingClientRect()[r] - gt(this[0], !t);
        var e = parseInt(i, 10);
        return this.each(function (s, f) {
          if (c(f)) {
            var a = T(f, "boxSizing");
            f.style[r] = wt(r, e + (a === "border-box" ? gt(f, !t) : 0));
          }
        });
      };
    });
  var Rt = "___cd";
  (u.toggle = function (t) {
    return this.each(function (n, r) {
      if (c(r)) {
        var i = vt(r),
          e = v(t) ? i : t;
        e
          ? ((r.style.display = r[Rt] || ""),
            vt(r) && (r.style.display = Jt(r.tagName)))
          : i || ((r[Rt] = T(r, "display")), (r.style.display = "none"));
      }
    });
  }),
    (u.hide = function () {
      return this.toggle(!1);
    }),
    (u.show = function () {
      return this.toggle(!0);
    });
  var xt = "___ce",
    Z = ".",
    k = { focus: "focusin", blur: "focusout" },
    Nt = { mouseenter: "mouseover", mouseleave: "mouseout" },
    dn = /^(mouse|pointer|contextmenu|drag|drop|click|dblclick)/i;
  function tt(t) {
    return Nt[t] || k[t] || t;
  }
  function nt(t) {
    var n = t.split(Z);
    return [n[0], n.slice(1).sort()];
  }
  u.trigger = function (t, n) {
    if (g(t)) {
      var r = nt(t),
        i = r[0],
        e = r[1],
        s = tt(i);
      if (!s) return this;
      var f = dn.test(s) ? "MouseEvents" : "HTMLEvents";
      (t = C.createEvent(f)),
        t.initEvent(s, !0, !0),
        (t.namespace = e.join(Z)),
        (t.___ot = i);
    }
    t.___td = n;
    var a = t.___ot in k;
    return this.each(function (y, h) {
      a &&
        O(h[t.___ot]) &&
        ((h["___i".concat(t.type)] = !0),
        h[t.___ot](),
        (h["___i".concat(t.type)] = !1)),
        h.dispatchEvent(t);
    });
  };
  function Lt(t) {
    return (t[xt] = t[xt] || {});
  }
  function ln(t, n, r, i, e) {
    var s = Lt(t);
    (s[n] = s[n] || []), s[n].push([r, i, e]), t.addEventListener(n, e);
  }
  function At(t, n) {
    return (
      !n ||
      !z.call(n, function (r) {
        return t.indexOf(r) < 0;
      })
    );
  }
  function F(t, n, r, i, e) {
    var s = Lt(t);
    if (n)
      s[n] &&
        (s[n] = s[n].filter(function (f) {
          var a = f[0],
            y = f[1],
            h = f[2];
          if ((e && h.guid !== e.guid) || !At(a, r) || (i && i !== y))
            return !0;
          t.removeEventListener(n, h);
        }));
    else for (n in s) F(t, n, r, i, e);
  }
  (u.off = function (t, n, r) {
    var i = this;
    if (v(t))
      this.each(function (s, f) {
        (!c(f) && !A(f) && !B(f)) || F(f);
      });
    else if (g(t))
      O(n) && ((r = n), (n = "")),
        d(j(t), function (s, f) {
          var a = nt(f),
            y = a[0],
            h = a[1],
            p = tt(y);
          i.each(function (M, b) {
            (!c(b) && !A(b) && !B(b)) || F(b, p, h, n, r);
          });
        });
    else for (var e in t) this.off(e, t[e]);
    return this;
  }),
    (u.remove = function (t) {
      return x(this, t).detach().off(), this;
    }),
    (u.replaceWith = function (t) {
      return this.before(t).remove();
    }),
    (u.replaceAll = function (t) {
      return o(t).replaceWith(this), this;
    });
  function gn(t, n, r, i, e) {
    var s = this;
    if (!g(t)) {
      for (var f in t) this.on(f, n, r, t[f], e);
      return this;
    }
    return (
      g(n) ||
        (v(n) || P(n)
          ? (n = "")
          : v(r)
            ? ((r = n), (n = ""))
            : ((i = r), (r = n), (n = ""))),
      O(i) || ((i = r), (r = void 0)),
      i
        ? (d(j(t), function (a, y) {
            var h = nt(y),
              p = h[0],
              M = h[1],
              b = tt(p),
              W = p in Nt,
              rt = p in k;
            b &&
              s.each(function (it, m) {
                if (!(!c(m) && !A(m) && !B(m))) {
                  var et = function (l) {
                    if (l.target["___i".concat(l.type)])
                      return l.stopImmediatePropagation();
                    if (
                      !(l.namespace && !At(M, l.namespace.split(Z))) &&
                      !(
                        !n &&
                        ((rt && (l.target !== m || l.___ot === b)) ||
                          (W && l.relatedTarget && m.contains(l.relatedTarget)))
                      )
                    ) {
                      var ut = m;
                      if (n) {
                        for (var _ = l.target; !pt(_, n); )
                          if (_ === m || ((_ = _.parentNode), !_)) return;
                        ut = _;
                      }
                      Object.defineProperty(l, "currentTarget", {
                        configurable: !0,
                        get: function () {
                          return ut;
                        },
                      }),
                        Object.defineProperty(l, "delegateTarget", {
                          configurable: !0,
                          get: function () {
                            return m;
                          },
                        }),
                        Object.defineProperty(l, "data", {
                          configurable: !0,
                          get: function () {
                            return r;
                          },
                        });
                      var bn = i.call(ut, l, l.___td);
                      e && F(m, b, M, n, et),
                        bn === !1 && (l.preventDefault(), l.stopPropagation());
                    }
                  };
                  (et.guid = i.guid = i.guid || o.guid++), ln(m, b, M, n, et);
                }
              });
          }),
          this)
        : this
    );
  }
  u.on = gn;
  function vn(t, n, r, i) {
    return this.on(t, n, r, i, !0);
  }
  u.one = vn;
  var pn = /\r?\n/g;
  function mn(t, n) {
    return "&".concat(encodeURIComponent(t), "=").concat(
      encodeURIComponent(
        n.replace(
          pn,
          `\r
`,
        ),
      ),
    );
  }
  var yn = /file|reset|submit|button|image/i,
    Ot = /radio|checkbox/i;
  (u.serialize = function () {
    var t = "";
    return (
      this.each(function (n, r) {
        d(r.elements || [r], function (i, e) {
          if (
            !(
              e.disabled ||
              !e.name ||
              e.tagName === "FIELDSET" ||
              yn.test(e.type) ||
              (Ot.test(e.type) && !e.checked)
            )
          ) {
            var s = bt(e);
            if (!v(s)) {
              var f = H(s) ? s : [s];
              d(f, function (a, y) {
                t += mn(e.name, y);
              });
            }
          }
        });
      }),
      t.slice(1)
    );
  }),
    typeof exports < "u" ? (module.exports = o) : (D.cash = D.$ = o);
})();
