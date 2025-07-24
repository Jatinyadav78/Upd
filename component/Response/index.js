'use client';
import React, { useState, useEffect } from 'react';
import Styles from './index.module.css';
import Response from './response.js'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';
import { toast } from "react-toastify";
import ResponseSkeleton from './responseSkeleton.js'
import { Button, Box, FormHelperText, InputLabel, TextField } from '@mui/material';
import Modal from '../ui/modal/modal.js'
import { DatePicker } from 'rsuite';
import { isBefore, subDays } from 'date-fns';
import { formatDate } from '../../helperFunction/dateTimeFormat';
import { Popover, Whisper } from 'rsuite';
import NotFound from '../error/notFound';
import CameraAltTwoToneIcon from '@mui/icons-material/CameraAltTwoTone';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';
import html2pdf from "html2pdf.js";


const Index = ({ permitNumber, Id, changeFormStatus, handleCancelBtn, status, changeBreadCrumbsStatus, handleAddImage }) => {
    const [formResData, setFormResData] = useState([])
    const [formDetails, setFormDetails] = useState(null)
    const [statusMsg, setStatusMsg] = useState()
    const [formState, setFormState] = useState()
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [dateRange, setDateRange] = useState(null);
    const [workDuration, setWorkDuration] = useState();
    const [timeExtension, setTimeExtension] = useState(null);
    const [isBlinking, setIsBlinking] = useState(true);
    const [loadingButton, setLoadingButton] = useState(false);
    const [isAccordianExt, setIsAccordianExt] = useState(false);
    const [pdfMode, setPdfMode] = useState(false);

    const validateDate = (selectedDate, workDuration) => {
        if (!workDuration?.to) {
            return true; // Allow selection if workDuration is not yet available
        }
        // const minDate = subDays(new Date(workDuration?.to), 0);
        return (selectedDate > new Date(workDuration?.to));
    };
    const remarkValidationSchema = Yup.object().shape({
        remark: Yup.string().required("Remark is required for rejection"),
    });
    const date = new Date(workDuration?.to)
    const timeExtValidationSchema = Yup.object().shape({
        selectDateTime: Yup.string()
            .typeError('Duration must be a valid date')
            .test('isAfterWorkDuration', 'You should select a date after work duration', value => {
                // Call the custom validation function
                return validateDate(new Date(value), workDuration);
            }).required("Please select date and time range"),
        reason: Yup.string().required('reason is required'),
    });
    const remarkFormOptions = { resolver: yupResolver(remarkValidationSchema) };
    const timeExtFormOptions = { resolver: yupResolver(timeExtValidationSchema) };

    const { register: registerRemark, handleSubmit: handleSubmitRemark, formState: formStateRemark, trigger: triggerRemark } = useForm(remarkFormOptions);
    const { errors: errorsRemark } = formStateRemark;

    const { register: registerTimeExt, setError, setValue: setTimeExtValue, handleSubmit: handleSubmitTimeExt, formState: formStateTimeExt, trigger: triggerTimeExt, reset: resetTimeExt } = useForm(timeExtFormOptions);
    const { errors: errorsTimeExt } = formStateTimeExt;

    const onSubmit = (data) => {
        updateStatus('rejected', data?.remark)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setDateRange(null);
        resetTimeExt();
    }

    const onSubmitTimeExt = async (data) => {
        const isValid = await triggerTimeExt("selectDateTime");
        if (!isValid) return;
        if (!workDuration?.to) {
            toast.error("No WorkDuration Found")
            return;
        }
        const reqBody = {
            //const { permitNumber, requested_by, requested_from, requested_to, reason } = req.body;
            permitNumber: permitNumber,
            requested_by: status ? Id : "vendor",
            requested_from: new Date(workDuration?.to)?.toISOString(), 
            requested_to: new Date(data?.selectDateTime)?.toISOString(),
            reason: data?.reason
        };
        try {
            const response = await axios.post(`v1/work-permit/request-extension`, reqBody);
            setTimeExtension(response?.data?.data?.extension)
            toast.success(`request sent`)
        } catch (error) {
            if (error?.status === 400) {
                toast.error(error?.response?.data?.message)
            }
            console.error("error in getting form response:", error);
        } finally {
            resetTimeExt();
        }
        setDateRange(null)
        setIsModalOpen(false);
    };

    const updateExtStatus = async (action) => {
        try {
            const reqBody = {
                permitNumber: permitNumber,
                approved_by: Id,
                status: action,
            }
            const response = await axios.put(`v1/work-permit/update-extension`, reqBody)
            if (response?.status === 200) {
                setTimeExtension(response?.data?.data?.extension)
                setWorkDuration(response?.data?.data?.workDuration)
                toast(`successfully ${action}`)
            }
        } catch (error) {
            console.error("error while time extension update Status:", error)
        }
    }
    const updateStatus = async (action, remark) => {
        if (action === 'rejected') {
            // Trigger validation for the "remark" field
            const isValid = await triggerRemark("remark");
            if (!isValid) {
                // If validation fails, return without updating status
                return;
            }
        }

        const reqBody = {
            userId: Id
        }
        action === 'rejected' && (reqBody["remark"] = remark);
        action === 'closed' ? reqBody["state"] = action : reqBody["status"] = action;
        try {
            const response = await axios.post(`v1/work-permit/response/${permitNumber}/status`, reqBody);
            toast(`successfully ${action}`)
            setFormResData([]);
            changeFormStatus();
        } catch (error) {
            console.error("error in getting form response:", error);
        }
    };

    const downloadResponse = async () => {
        setIsAccordianExt(true);
        setLoadingButton(true);
        const name = formDetails?.formName?.split(" ")[0];
        setPdfMode(true); // ✅ Enable PDF mode
        await new Promise((resolve) => requestAnimationFrame(resolve));

        setTimeout(async () => {
            const element = document.getElementById('responseDownload');
            // console.log('element', element);

            if (!element) {
                console.error('Element not found');
                setLoadingButton(false);
                setPdfMode(false);
                return;
            }

            try {
                const options = {
                    margin: 0.5,
                    filename: `${name}-${permitNumber}-response.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        logging: true,
                    },
                    jsPDF: {
                        unit: "in",
                        format: "letter",
                        orientation: "portrait",
                    },
                };

                await html2pdf().set(options).from(element).save();
            } catch (err) {
                console.error('Error creating PDF:', err);
                alert('Failed to generate PDF');
            } finally {
                setPdfMode(false); // ✅ Disable PDF mode
                setLoadingButton(false);
            }
        }, 1000);
    };




    useEffect(() => {
        const fetchFormResData = async () => {
            if (!permitNumber) return;
            try {
                // throw new Error('hi')
                const response = await axios.get(`v1/work-permit/response?permitNumber=${permitNumber}`)
                setFormDetails(response?.data?.formDetail)
                setFormState(response?.data?.state);
                setStatusMsg(response?.data?.approver?.filter((apr) => apr?.userId === Id)[0]?.status)
                setTimeExtension(response?.data?.extension)
                setWorkDuration(response?.data?.workDuration)
                setFormResData([...response?.data?.response, { sectionName: 'status', responses: response?.data?.approver }])
                changeBreadCrumbsStatus(response?.data?.approver?.filter((apr) => apr?.userId === Id)[0]?.status)
            } catch (error) {
                // setStatusMsg(approver.filter((apr) => apr?.userId === Id)[0]?.status)
                // setFormResData([...responseData,{sectionName:'imageCaptured'}, { sectionName: 'status', responses: approver }])
                console.error("error in getting form response:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchFormResData()
    }, [permitNumber])

    return (
        <div className={Styles.formResponse} >
            {formResData.length > 0 && formState !== 'pending' && <div style={{ height: '35px', width: '100%', position: 'relative', right: '25px' }} className='d-flex justify-content-end'>
                <Button
                    loading={loadingButton}
                    loadingPosition="end"
                    endIcon={<DownloadForOfflineRoundedIcon />}
                    variant="outlined"
                    size="small"
                    // className="responsive-button"
                    style={{
                        borderRadius: 10,
                    }}
                    onClick={downloadResponse}
                >
                    Download
                </Button>
            </div>}
            <div
                id="responseDownload"
                style={{
                    padding: 20,
                    // border: '2px dashed #444',
                    background: '#fff',
                    color: '#000',
                    marginBottom: 20,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={formState === 'pending' ? Styles.pendingStatus : formState === 'approved' ? Styles.approvedStatus : Styles.rejectedStatus}>
                    <h2 style={{ color: '#0073FF', fontWeight: '600' }}>{formDetails?.formName}</h2>
                </div>
                {/*show status when vendor request is rejected and approved */}
                {formResData.length > 0 && formState && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={formState === 'pending' ? Styles.pendingStatus : formState === 'approved' ? Styles.approvedStatus : Styles.rejectedStatus}>
                    <h4 style={{ color: '#000000ba', fontWeight: '400' }}>Permit Status :</h4>
                    <h4 style={{ textTransform: 'capitalize', marginLeft: '2px' }}>{formState}</h4>
                </div>}
                <div className={Styles.timeExt}>
                    {!(formResData?.length === 0) && <div className='d-flex' style={{ flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Permit Valid Upto:</div>
                        <div style={{ textAlign: 'left', marginLeft: '5px' }}>{formatDate(workDuration?.to, true)}</div>
                    </div>}

                    {formState === 'approved' && !(timeExtension?.status === 'pending') && process.env.NEXT_PUBLIC_TIME_EXTENSION === 'true' &&
                        <div style={{ height: '35px', width: '170px' }} className='d-flex'>
                            <Button
                                className='text-nowrap'
                                variant='contained'
                                onClick={() => setIsModalOpen(prev => !prev)}
                            >
                                Extend Permit Time
                            </Button>
                        </div>}
                </div>

                {formResData.length > 0 && status && <div className='d-flex justify-content-between'>
                    <div>
                        {formState === 'approved' && timeExtension?.status === 'pending' &&
                            <Whisper
                                trigger="click"
                                placement='bottomStart'
                                controlId={`Extension-Requested`}
                                speaker={
                                    (<Popover title="Time Extension Request" visible>
                                        <form className={Styles.extForm} onSubmit={handleSubmitTimeExt(onSubmitTimeExt)}>
                                            <div>
                                                <InputLabel style={{ width: '100%', position: 'relative', color: 'black', marginLeft: '6px' }} required >Extended To
                                                </InputLabel>
                                                <DatePicker
                                                    id={'selectTime'}
                                                    disabled
                                                    ranges={[]}
                                                    format="dd/MM/yyyy HH:mm"
                                                    size='sm'
                                                    style={{ width: '100%' }}
                                                    showOneCalendar
                                                    value={new Date(timeExtension?.requested_duration?.to)}
                                                    editable={false}
                                                />
                                            </div>
                                            <div >
                                                <InputLabel style={{ width: '100%', position: 'relative', color: 'black', marginLeft: '6px' }} >Reason
                                                </InputLabel>
                                                <TextField
                                                    disabled
                                                    type='text'
                                                    value={timeExtension?.reason}
                                                    placeholder='Reason'
                                                    size='small'
                                                    fullWidth
                                                />
                                            </div>
                                            <div className={Styles.buttonCont} >
                                                <Button
                                                    style={{ height: '34px' }}
                                                    variant='outlined'
                                                    onClick={() => updateExtStatus('reject')}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    type='submit'
                                                    variant='contained'
                                                    style={{ background: 'green' }}
                                                    onClick={() => updateExtStatus('approved')}//   onClick={() => setSendViaEmail(true)}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        </form>
                                    </Popover>)
                                }
                            >
                                <Button
                                    className={`${Styles.extReqBtn} `}
                                    onClick={() => setIsBlinking(false)}
                                ><p className={`${isBlinking ? Styles.blinkingButton : ''}`} style={{ margin: '0' }}>
                                        Extension Requested
                                    </p>
                                </Button>
                            </Whisper>}
                    </div>
                </div>}
                <hr></hr>
                {/*show responses of vendor for approval */}
                <div >
                    {loading ? <ResponseSkeleton /> : formResData?.length === 0 ? (<div style={{ height: '60vh' }}><NotFound /></div>) : <div
                    >{formResData.map((res, index) => (
                        <Response key={index} sectionName={res.sectionName} isAccordianExt={isAccordianExt} response={res.responses} permitNumber={permitNumber} />))}
                    </div>}
                </div>

                {/* Modal for time extension */}
                <Modal isOpen={isModalOpen} onClose={handleModalClose} heading={'Time Extension'}
                    boxStyle={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: "50%",
                        minWidth: '300px',
                        bgcolor: 'background.paper',
                        borderRadius: '15px',
                        boxShadow: 24,
                        p: 4,
                        paddingTop: '13px',
                    }}
                >
                    <Box sx={{ width: "100%" }} >
                        <form className={Styles.form} onSubmit={handleSubmitTimeExt(onSubmitTimeExt)}>
                            <div>
                                <InputLabel style={{ width: '100%', position: 'relative', color: 'black', marginLeft: '6px' }} required >From
                                </InputLabel>
                                <DatePicker
                                    id={'selectTime'}
                                    disabled
                                    ranges={[]}
                                    format="dd/MM/yyyy HH:mm"
                                    size='md'
                                    style={{ width: '100%' }}
                                    showOneCalendar
                                    value={new Date(workDuration?.to)}
                                    editable={false}
                                />
                            </div>
                            <div>
                                <InputLabel style={{ width: '100%', position: 'relative', color: 'black', marginLeft: '6px' }} required >To
                                </InputLabel>
                                <DatePicker
                                    id={'selectDateTime'}
                                    {...registerTimeExt('selectDateTime')}
                                    onChange={(value) => {
                                        setTimeExtValue('selectDateTime', value);
                                        setDateRange(value);
                                        triggerTimeExt('selectDateTime')
                                    }}
                                    onBlur={() => triggerTimeExt('selectDateTime')}
                                    ranges={[]}
                                    format="dd/MM/yyyy HH:mm"
                                    size='md'
                                    style={{ width: '100%' }}
                                    showOneCalendar
                                    value={dateRange}
                                    editable={false}
                                    shouldDisableDate={date => isBefore(date, subDays(new Date(workDuration?.to), 1))}
                                />
                                {errorsTimeExt?.selectDateTime && <FormHelperText error>{errorsTimeExt.selectDateTime.message}</FormHelperText>}
                            </div>
                            <div>
                                <InputLabel style={{ width: '100%', position: 'relative', color: 'black', marginLeft: '6px' }} >Reason
                                </InputLabel>
                                <TextField
                                    type='text'
                                    {...registerTimeExt('reason')}
                                    onChange={(e) => {
                                        setTimeExtValue('reason', e.target.value);
                                        triggerTimeExt('reason')
                                    }}
                                    onBlur={() => triggerTimeExt('reason')}
                                    placeholder='Reason'
                                    size='small'
                                    fullWidth
                                />
                                {errorsTimeExt?.reason && <FormHelperText error>{errorsTimeExt.reason.message}</FormHelperText>}
                            </div>
                            <div className={Styles.buttonCont} >
                                <Button
                                    style={{ height: '34px' }}
                                    variant='outlined'
                                    onClick={handleModalClose}>
                                    close
                                </Button>
                                <Button
                                    type='submit'
                                    variant='contained'
                                //   onClick={() => setSendViaEmail(true)}
                                >
                                    submit
                                </Button>
                            </div>
                        </form>
                    </Box>
                </Modal>

                {/* show status when vendor request is rejected and approved */}
                {/* {formResData.length > 0 && formState && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={formState === 'pending' ? Styles.pendingStatus : formState === 'approved' ? Styles.approvedStatus : Styles.rejectedStatus}>
                <h4 style={{ color: '#000000ba', fontWeight: '600' }}>Permit Status :</h4>
                <h4 style={{ textTransform: 'capitalize', marginLeft: '2px' }}>{formState}</h4>
            </div>} */}

                {/*QrCodeGenerator */}
                {formResData.length > 0 && formState === 'approved' &&
                    <>
                       {!pdfMode && <div className="d-flex justify-content-center align-items-center">
                            <QRCodeGenerator permitNumber={permitNumber} />
                        </div>}

                        {/* ✅ Show only in PDF mode */}
                        {pdfMode && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '30px',
                                    pageBreakInside: 'avoid',
                                    breakInside: 'avoid',
                                }}
                            >
                                <h3 style={{ marginBottom: '15px' }}>QR Code</h3>
                                <div
                                    style={{
                                        display: 'inline-block',
                                        border: '2px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '20px',
                                    }}
                                >
                                    <QRCodeGenerator permitNumber={permitNumber} />
                                </div>
                            </div>
                        )}
                    </>}
            </div>

            {/*remark */}
            <form onSubmit={handleSubmitRemark(onSubmit)}>
                {formResData.length > 0 && status && statusMsg === 'pending' &&
                    <>
                        <h2 >Remark</h2>
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Remark"
                                {...registerRemark("remark")}
                                className={`form-control ${errorsRemark.remark ? "is-invalid" : ""}`}
                            />
                            <div className="invalid-feedback">
                                {errorsRemark.remark?.message}
                            </div>
                        </div>
                    </>
                }

                {/*button for approve , rejected and cancel */}
                {
                    formResData.length > 0 && status && <div className={Styles.buttonContainer} style={{ justifyContent: !(statusMsg === 'pending') && 'center' }}>
                        <button type='button' className={Styles.cancelBtn} onClick={handleCancelBtn} >Cancel</button>
                        {
                            statusMsg === 'pending' && <div className={Styles.btnRejApv}>
                                <button id='reject' type='submit' className={Styles.rejectedBtn} >Reject</button>
                                <button id='approve' type='button' className={Styles.approvedBtn} onClick={() => { updateStatus('approved') }}>Approve</button>
                            </div>
                        }
                        {
                            formState === 'approved' && statusMsg === 'approved' &&
                            <div className={Styles.btnRejApv}>
                                {formState === 'approved' && <Button type='button' variant='contained' endIcon={<CameraAltTwoToneIcon />} onClick={() => handleAddImage(permitNumber, statusMsg)}>Add Image </Button>}
                                <button id='closed' type='button' className={Styles.rejectedBtn} onClick={() => { updateStatus('closed') }}>Close Permit</button>
                            </div>
                        }
                        {
                            formState === 'closed' && statusMsg === 'closed' &&
                            <Button type='button' variant='contained' endIcon={<CameraAltTwoToneIcon />} onClick={() => handleAddImage(permitNumber, formState)}>View Images </Button>
                        }

                    </div>
                }
            </form>
        </div>
    )
}

export default Index