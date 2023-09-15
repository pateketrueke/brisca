/* eslint-disable max-classes-per-file */
import Therror from 'therror';

export const Unauthorized = class extends Therror.HTTP(401) {};
