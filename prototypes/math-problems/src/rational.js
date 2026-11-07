// SPDX-License-Identifier: GPL-2.0-or-later
/** Exact, normalized rational arithmetic. Public serialization uses decimal strings. */
export class MathProblemError extends Error {
  constructor(code,message){super(message);this.name='MathProblemError';this.code=code;}
}
function integerValue(value) {
  if(typeof value==='bigint')return value;
  if(typeof value==='number'&&Number.isSafeInteger(value))return BigInt(value);
  if(typeof value==='string'&&/^-?\d{1,128}$/.test(value))return BigInt(value);
  throw new MathProblemError('INVALID_INTEGER','Expected a safe integer, BigInt, or decimal integer string (up to 128 digits)');
}
export function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a;}
export class Rational {
  constructor(numerator,denominator=1n){let n=integerValue(numerator),d=integerValue(denominator);if(d===0n)throw new MathProblemError('ZERO_DENOMINATOR','A denominator cannot be zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);this.n=n/g;this.d=d/g;Object.freeze(this);}
  static from(value){if(value instanceof Rational)return value;if(value&&typeof value==='object')return new Rational(value.numerator,value.denominator);return new Rational(value);}
  add(value){const q=Rational.from(value);return new Rational(this.n*q.d+q.n*this.d,this.d*q.d);}
  sub(value){return this.add(Rational.from(value).neg());}
  mul(value){const q=Rational.from(value);return new Rational(this.n*q.n,this.d*q.d);}
  div(value){const q=Rational.from(value);return new Rational(this.n*q.d,this.d*q.n);}
  neg(){return new Rational(-this.n,this.d);}
  equals(value){const q=Rational.from(value);return this.n===q.n&&this.d===q.d;}
  get isZero(){return this.n===0n;}
  toString(){return this.d===1n?String(this.n):`${this.n}/${this.d}`;}
  toJSON(){return {numerator:String(this.n),denominator:String(this.d)};}
}
