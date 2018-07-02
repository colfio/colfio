// bit array for flags
class Flags {
	constructor() {
		// flag array 0-128
		this.flags1 = 0;
		this.flags2 = 0;
		this.flags3 = 0;
		this.flags4 = 0;
	}

	hasFlag(flag) {
		let index = this._getFlagIndex(flag);
		let offset = this._getFlagOffset(flag);
		let binary = 1 << offset;

		if (index <= 3) {
			switch (index) {
				case 0: return (this.flags1 & binary) == binary;
				case 1: return (this.flags2 & binary) == binary;
				case 2: return (this.flags3 & binary) == binary;
				case 3: return (this.flags4 & binary) == binary;
			}
		} else {
			throw new Error("Flag values beyond 128 are not supported");
		}
	}

	switchFlag(flag1, flag2) {
		let hasFlag2 = this.hasFlag(flag2);

		if (this.hasFlag(flag1)) this.setFlag(flag2);
		else this.resetFlag(flag2);

		if (hasFlag2) this.setFlag(flag1);
		else this.resetFlag(flag1);
	}

	setFlag(flag) {
		this._changeFlag(true, flag);
	}

	resetFlag(flag) {
		this._changeFlag(false, flag);
	}

	_getFlagIndex(flag) {
		return parseInt(flag / 32); // sizeof 32bit int
	}

	_getFlagOffset(flag) {
		return flag % 32; // sizeof 32bit int
	}

	_changeFlag(set, flag) {
		let index = this._getFlagIndex(flag);
		let offset = this._getFlagOffset(flag);
		let binary = 1 << offset;

		if (index <= 3) {
			switch (index) {
				case 0: if (set) (this.flags1 |= binary); else (this.flags1 &= ~binary);
				case 1: if (set) (this.flags2 |= binary); else (this.flags2 &= ~binary);
				case 2: if (set) (this.flags3 |= binary); else (this.flags3 &= ~binary);
				case 3: if (set) (this.flags4 |= binary); else (this.flags4 &= ~binary);
			}
		} else {
			throw new Error("Flag values beyond 128 are not supported");
		}
	}
}
