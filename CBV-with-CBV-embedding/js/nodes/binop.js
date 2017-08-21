class BinOp extends Node {

	constructor(text) {
		super(null, text);
		this.subType = null;
	}
	
	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			token.dataStack.push(CompData.PROMPT);
			token.forward = true;
			return this.findLinksOutOf("w")[0];
		}
		else if (link.from == this.key && link.fromPort == "w") {
			if (token.dataStack[token.dataStack.length-3] == CompData.PROMPT) {
				var l = token.dataStack.pop();
				var r = token.dataStack.pop();
			 			token.dataStack.pop();
			 	var result = this.binOpApply(this.subType, l, r);

				token.dataStack.push(result);
				token.rewriteFlag = RewriteFlag.F_OP;
				return this.findLinksInto(null)[0];
			}
		}
	}

	rewrite(token, nextLink) {
		if (nextLink.to == this.key) {
			if (token.rewriteFlag == RewriteFlag.F_OP) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				var right = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);

				if (left instanceof Const && right instanceof Const) {
					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(token.dataStack.last()).addToGroup(wrapper.box);
					var newLink = new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
					nextLink.changeTo(wrapper.prin.key, "s");
					
					left.delete();
					right.delete();
					this.delete();

					token.rewriteFlag = RewriteFlag.F_PROMO;
				}

				token.rewrite = true;
				return newLink;
			}
		}
		token.rewrite = false;
		return nextLink;
	}

	binOpApply(type, v1, v2) {
		switch(type) {
			case BinOpType.And: return v1 && v2;
			case BinOpType.Or: return v1 || v2;
			case BinOpType.Plus: return parseFloat(v1) + parseFloat(v2);
			case BinOpType.Sub: return parseFloat(v1) - parseFloat(v2);
			case BinOpType.Mult: return parseFloat(v1) * parseFloat(v2);
			case BinOpType.Div: return parseFloat(v1) / parseFloat(v2);
			case BinOpType.Lte: return parseFloat(v1) <= parseFloat(v2);
		}
	}

	static createPlus() {
		var node = new BinOp("+");
		node.subType = BinOpType.Plus;
		return node;
	}

	static createMult() {
		var node = new BinOp("*");
		node.subType = BinOpType.Mult;
		return node;
	}

	copy() {
		var newNode = new BinOp(this.text);
		newNode.subType = this.subType;
		return newNode;
	}
}