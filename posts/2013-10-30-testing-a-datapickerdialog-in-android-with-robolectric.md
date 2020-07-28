---
title: 'Testing a DataPickerDialog in Android with Robolectric'
date: '2013-10-30'
---
This is not actual a tutorial, rather a report on what I've tried to do test it.

I was following the documentation located on [Android Developers](http://developer.android.com/reference/android/app/DatePickerDialog.html) about create a **DatePickerDialog**.

I started using a DatePicker component in the xml layout of the activity, but the thing was pretty ugly, so I tried this solution instead.

I'll explain first the implementation because it's pretty similar to the example taken from the docs, although I started writing tests first.

~~~ java
import java.util.Calendar;

import android.app.DatePickerDialog;
import android.app.Dialog;
import android.os.Bundle;
import android.support.v4.app.DialogFragment;
import android.widget.DatePicker;

public class DatePickerFragment extends DialogFragment implements
		DatePickerDialog.OnDateSetListener {

	final Calendar calendar = Calendar.getInstance();

	@Override
	public Dialog onCreateDialog(Bundle savedInstanceState) {
	   // I create the new DatePickerDialog setting the date to now
	   // this is the part I'm having the problem with Robolectric
	   // it doesn't seem I'm able to test that the date is setted to NOW
		return new DatePickerDialog(getActivity(), this,
				calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH),
				calendar.get(Calendar.DAY_OF_MONTH));
	}

	@Override
	public void onDateSet(DatePicker view, int year, int month, int day) {
	   /** onDataset **/ implementation
	}

}
~~~

As you can see the code is pretty straight forward. What I wanted to test is that, given a certain DataPickerDialog, the date showed is the one I set.
The date picker is a **DialogFragment** so I want to be able to test it without the usage of a the activity where I want to use the dialog.
When I use the activity it become an integration test, kinda :)

Let's start saying a Dialog is a pain in the ass to test. You still need to build a **FragmentActivity** and then call a **FragmentManager**.
You start the transaction, call `show` on the fragment, and then you execute the call. Let's see it:

~~~ java
@RunWith(RobolectricTestRunner.class)
public class DatePickerFragmentTest {

	@Test
	public void testDatePickerFragment() {
		final Calendar calendar = Calendar.getInstance();
		int expectedYear = calendar.get(Calendar.YEAR);
		int expectedMonth = calendar.get(Calendar.MONTH);
		int expectedDay = calendar.get(Calendar.DAY_OF_MONTH);

		DatePickerFragment fragment = new DatePickerFragment();

		FragmentActivity activity = Robolectric
				.buildActivity(FragmentActivity.class).create().start()
				.resume().get();

		FragmentManager fragmentManager = activity.getSupportFragmentManager();
		FragmentTransaction fragmentTransaction = fragmentManager
				.beginTransaction();
		fragment.show(fragmentManager, "datePicker");
		fragmentTransaction.commit();
		fragmentManager.executePendingTransactions();

		DatePickerDialog dialog = (DatePickerDialog) ShadowDatePickerDialog
				.getLatestDialog();

		assertThat(dialog, is(not(nullValue())));

		assertThat(dialog.getDatePicker().getDayOfMonth(), is(expectedDay));
		assertThat(dialog.getDatePicker().getMonth(), is(expectedMonth));
		assertThat(dialog.getDatePicker().getYear(), is(expectedYear));
	}

}
~~~

This is where I'm blocked. It seems I'm able to assert that the dialog is not null, but when it comes to execute the `getDataPicker`, I have a big fat `NullPointerException`.
Asking the question on [stackoverflow](http://stackoverflow.com/questions/19661651/is-there-a-way-to-test-pickers-with-robolectric?noredirect=1#comment29221761_19661651) right now didn't give me a viable solution.

Next step would be to try a real fragment activity with a layout. If even then I go no where, I'll test it with Robotium. Stay tuned.
