import {it,expect} from 'vitest';
import {IdentityScope,ResendCooldown} from '../../src/features/auth/state';
it('discards a previous accounts delayed response',()=>{const scope=new IdentityScope();scope.change('A');const captured=scope.capture();scope.change('B');expect(scope.isCurrent(captured)).toBe(false);expect(scope.isCurrent(scope.capture())).toBe(true)});
it('signout invalidates private responses without changing identity on token refresh',()=>{const scope=new IdentityScope();scope.change('A');const epoch=scope.capture();scope.change('A');expect(scope.isCurrent(epoch)).toBe(true);scope.change(null);expect(scope.isCurrent(epoch)).toBe(false)});
it('resend cooldown counts elapsed time and does not start on failure',()=>{const clock={now:0};const cooldown=new ResendCooldown(()=>clock.now);expect(cooldown.remaining()).toBe(0);cooldown.sent();expect(cooldown.remaining()).toBe(60);clock.now=61000;expect(cooldown.remaining()).toBe(0)});
