import { react2AngularDirective } from 'app/core/bridge';
import { SharedPreferences } from 'app/core/components/SharedPreferences/SharedPreferences';

react2AngularDirective('prefsControl', SharedPreferences, ['resourceUri']);
